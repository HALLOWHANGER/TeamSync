import { z } from "zod";
import type { MessageType, FileAttachmentType } from "@/chat_src/types/chat.type";
import { useRef, useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { File as FileIcon, Mic, Paperclip, Send, Square, X } from "lucide-react";
import { Form, FormField, FormItem } from "../ui/form";
import ChatReplyBar from "./chat-reply-bar";
import { useChat } from "@/chat_src/hooks/use-chat";
import { useSocket } from "@/chat_src/hooks/use-socket";
import type { UserType } from "@/chat_src/types/auth.type";
import { cn } from "@/chat_src/lib/utils";

interface Props {
  chatId: string | null;
  currentUserId: string | null;
  currentUser: UserType | null;
  replyTo: MessageType | null;
  onCancelReply: () => void;
}

const messageSchema = z.object({ message: z.string().optional() });

const ChatFooter = ({ chatId, currentUserId, currentUser, replyTo, onCancelReply }: Props) => {
  const { sendMessage, isSendingMsg } = useChat();
  const { emitTypingStart, emitTypingStop } = useSocket();

  // ── Typing ───────────────────────────────────────────────────────────────
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Image / File state ───────────────────────────────────────────────────
  const [image, setImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<FileAttachmentType | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Voice note state ─────────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  });

  useEffect(() => {
    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (chatId) emitTypingStop(chatId);
      stopRecording();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // ── Typing handlers ──────────────────────────────────────────────────────
  const handleTyping = () => {
    if (!chatId) return;
    emitTypingStart(chatId);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTypingStop(chatId), 2000);
  };

  // ── Image handler ────────────────────────────────────────────────────────
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Select an image file"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── File attachment handler ───────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10 MB)"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedFile({ name: file.name, type: file.type, size: file.size, data: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const clearAttachments = () => {
    setImage(null);
    setAttachedFile(null);
    setVoiceNote(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => setVoiceNote(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  }, []);

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setVoiceNote(null);
    audioChunksRef.current = [];
  };

  const fmtSec = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = (values: { message?: string }) => {
    if (isSendingMsg) return;
    const hasContent = values.message?.trim() || image || attachedFile || voiceNote;
    if (!hasContent) { toast.error("Add a message, image, file, or voice note"); return; }

    if (chatId) emitTypingStop(chatId);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);

    sendMessage(
      {
        chatId,
        content: values.message,
        image: image || undefined,
        voiceNote: voiceNote || undefined,
        fileAttachment: attachedFile || undefined,
        replyTo,
      },
      currentUser
    );

    onCancelReply();
    clearAttachments();
    form.reset();
  };

  const hasAttachment = image || attachedFile || voiceNote;

  return (
    <>
      {replyTo && !isSendingMsg && (
        <ChatReplyBar replyTo={replyTo} currentUserId={currentUserId} onCancel={onCancelReply} />
      )}

      <div className="sticky bottom-0 inset-x-0 z-[999] bg-card border-t border-border">
        {/* Preview area */}
        {hasAttachment && !isSendingMsg && (
          <div className="max-w-6xl mx-auto px-6 pt-3">
            <div className="flex items-start gap-3 p-2 bg-muted/40 rounded-lg border border-border">
              {image && (
                <div className="relative">
                  <img src={image} className="h-14 w-14 object-cover rounded-md" />
                  <button onClick={() => setImage(null)} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:opacity-90"><X size={10} /></button>
                </div>
              )}
              {attachedFile && !attachedFile.type.startsWith("image/") && (
                <div className="flex items-center gap-2 bg-background rounded-md px-3 py-2 border border-border flex-1">
                  <FileIcon size={16} className="text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{attachedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{(attachedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setAttachedFile(null)} className="ml-auto flex-shrink-0"><X size={12} className="text-muted-foreground hover:text-foreground" /></button>
                </div>
              )}
              {voiceNote && (
                <div className="flex items-center gap-2 bg-background rounded-md px-3 py-2 border border-border flex-1">
                  <Mic size={14} className="text-green-500 flex-shrink-0" />
                  <p className="text-xs">Voice note ready</p>
                  <button onClick={() => setVoiceNote(null)} className="ml-auto"><X size={12} className="text-muted-foreground hover:text-foreground" /></button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recording bar */}
        {isRecording && (
          <div className="max-w-6xl mx-auto px-6 pt-3">
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <Mic size={14} className="text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">{fmtSec(recordingSeconds)}</span>
              <span className="text-xs text-red-500 flex-1">Recording…</span>
              <button onClick={cancelRecording} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Input row */}
        <div className="py-3 px-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-6xl px-4 mx-auto flex items-end gap-2">
              {/* Attachment buttons */}
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" disabled={isSendingMsg || isRecording} className="rounded-full h-9 w-9" onClick={() => imageInputRef.current?.click()} title="Attach image">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button type="button" variant="ghost" size="icon" disabled={isSendingMsg || isRecording} className="rounded-full h-9 w-9" onClick={() => fileInputRef.current?.click()} title="Attach file">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
                <input type="file" className="hidden" accept="image/*" disabled={isSendingMsg} ref={imageInputRef} onChange={handleImageChange} />
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip" disabled={isSendingMsg} ref={fileInputRef} onChange={handleFileChange} />
              </div>

              {/* Text input */}
              <FormField
                control={form.control}
                name="message"
                disabled={isSendingMsg || isRecording}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <input
                      {...field}
                      autoComplete="off"
                      placeholder={isRecording ? "Recording voice note…" : "Type a message…"}
                      disabled={isSendingMsg || isRecording}
                      className={cn(
                        "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px]",
                        isRecording && "cursor-not-allowed"
                      )}
                      onChange={(e) => { field.onChange(e); handleTyping(); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                    />
                  </FormItem>
                )}
              />

              {/* Voice note button */}
              <Button
                type="button"
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                className="rounded-full h-9 w-9 flex-shrink-0"
                disabled={isSendingMsg}
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? "Stop recording" : "Record voice note"}
              >
                {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4 text-muted-foreground" />}
              </Button>

              {/* Send button */}
              <Button type="submit" size="icon" className="rounded-lg h-9 w-9 flex-shrink-0" disabled={isSendingMsg || isRecording}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default ChatFooter;
