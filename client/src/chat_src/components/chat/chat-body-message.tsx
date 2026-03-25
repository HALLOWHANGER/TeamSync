import { memo, useRef, useState } from "react";
import { cn } from "@/chat_src/lib/utils";
import type { MessageType, ReactionType } from "@/chat_src/types/chat.type";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "@/chat_src/lib/helper";
import { Button } from "../ui/button";
import { CheckCheck, Clock, Download, FileText, Pause, Play, ReplyIcon, RotateCcw, SmilePlus } from "lucide-react";
import { useChat } from "@/chat_src/hooks/use-chat";

// ─── Common emoji list for reactions ─────────────────────────────────────────
const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉"];

interface Props {
  message: MessageType;
  onReply: (message: MessageType) => void;
  currentUserId: string | null;
}

const ChatMessageBody = memo(({ message, onReply, currentUserId }: Props) => {
  const { toggleReaction } = useChat();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isCurrentUser = message.sender?._id === currentUserId;
  const senderName = isCurrentUser ? "You" : message.sender?.name;
  const replySenderName = message.replyTo?.sender?._id === currentUserId ? "You" : message.replyTo?.sender?.name;

  // Group reactions: { emoji → count, userReacted }
  const groupedReactions = (message.reactions ?? []).reduce<
    Record<string, { count: number; userReacted: boolean; users: string[] }>
  >((acc, r: ReactionType) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userReacted: false, users: [] };
    acc[r.emoji].count++;
    acc[r.emoji].users.push(r.userName);
    if (r.userId === currentUserId) acc[r.emoji].userReacted = true;
    return acc;
  }, {});

  // ── Read receipt icon ────────────────────────────────────────────────────
  const ReadIcon = () => {
    if (!isCurrentUser) return null;
    if (message.status === "sending") return <Clock className="w-3 h-3 text-gray-400 mt-0.5 ml-1" />;
    if (message.status === "failed") return <RotateCcw className="w-3 h-3 text-red-400 mt-0.5 ml-1" />;
    const isRead = (message.readBy ?? []).filter((id) => id !== currentUserId).length > 0;
    return <CheckCheck className={cn("w-3.5 h-3.5 mt-0.5 ml-1", isRead ? "text-blue-500" : "text-gray-400")} />;
  };

  const StreamingCursor = () =>
    message.streaming ? (
      <span className="inline-block w-1.5 h-3.5 bg-current ml-0.5 align-middle animate-pulse rounded-sm" />
    ) : null;

  const containerClass = cn("group relative flex gap-2 py-1.5 px-4", isCurrentUser && "flex-row-reverse text-left");
  const contentWrapperClass = cn("max-w-[72%] flex flex-col relative", isCurrentUser && "items-end");
  const messageClass = cn(
    "min-w-[160px] px-3 py-2 text-sm break-words shadow-sm",
    isCurrentUser ? "bg-accent dark:bg-primary/40 rounded-tr-xl rounded-l-xl" : "bg-[#F5F5F5] dark:bg-accent rounded-bl-xl rounded-r-xl",
    message.status === "failed" && "opacity-60"
  );
  const replyBoxClass = cn(
    "mb-2 p-2 text-xs rounded-md border-l-4 shadow-md !text-left",
    isCurrentUser ? "bg-primary/20 border-l-primary" : "bg-gray-200 dark:bg-secondary border-l-[#CC4A31]"
  );

  const handleReact = (emoji: string) => {
    toggleReaction(message._id, emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className={containerClass}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 flex items-start pt-1">
          <AvatarWithBadge name={message.sender?.name || "?"} src={message.sender?.avatar || ""} />
        </div>
      )}

      <div className={contentWrapperClass}>
        <div className={cn("flex items-end gap-1", isCurrentUser && "flex-row-reverse")}>
          <div className={messageClass}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-0.5 pb-1 border-b border-black/5 dark:border-white/10">
              <span className="text-xs font-semibold">{senderName}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatChatTime(message?.createdAt)}</span>
            </div>

            {/* Reply box */}
            {message.replyTo && (
              <div className={replyBoxClass}>
                <h5 className="font-semibold">{replySenderName}</h5>
                <p className="text-muted-foreground max-w-[220px] truncate">
                  {message.replyTo.voiceNote ? "🎤 Voice note" : message.replyTo.fileAttachment ? `📎 ${message.replyTo.fileAttachment.name}` : message.replyTo.content || (message.replyTo.image ? "📷 Photo" : "")}
                </p>
              </div>
            )}

            {/* Image */}
            {message.image && (
              <img src={message.image} alt="" className="rounded-lg max-w-xs mb-1 cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(message.image!, "_blank")} />
            )}

            {/* Voice note */}
            {message.voiceNote && <VoiceNotePlayer src={message.voiceNote} isCurrentUser={isCurrentUser} />}

            {/* File attachment */}
            {message.fileAttachment && <FileAttachment file={message.fileAttachment} isCurrentUser={isCurrentUser} />}

            {/* Text */}
            {message.content && (
              <p className="leading-relaxed">{message.content}<StreamingCursor /></p>
            )}
          </div>

          {/* Hover actions */}
          <div className={cn("flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mb-1", isCurrentUser && "flex-row-reverse")}>
            <div className="relative">
              <Button variant="ghost" size="icon" className="!size-7 rounded-full hover:bg-muted" onClick={() => setShowEmojiPicker((v) => !v)}>
                <SmilePlus size={14} className="text-muted-foreground" />
              </Button>
              {showEmojiPicker && (
                <div className={cn(
                  "absolute bottom-8 z-50 bg-card border border-border rounded-xl px-2 py-1.5 shadow-xl flex gap-1",
                  isCurrentUser ? "right-0" : "left-0"
                )}>
                  {EMOJI_LIST.map((emoji) => (
                    <button key={emoji} onClick={() => handleReact(emoji)} className="text-lg hover:scale-125 transition-transform leading-none p-0.5">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="!size-7 rounded-full hover:bg-muted" onClick={() => onReply(message)}>
              <ReplyIcon size={14} className={cn("text-muted-foreground", isCurrentUser && "scale-x-[-1]")} />
            </Button>
          </div>
        </div>

        {/* Reactions row */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-1", isCurrentUser && "justify-end")}>
            {Object.entries(groupedReactions).map(([emoji, { count, userReacted, users }]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                title={users.join(", ")}
                className={cn(
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                  userReacted ? "bg-primary/15 border-primary/40 text-primary" : "bg-muted/60 border-border text-foreground hover:bg-muted"
                )}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="font-medium">{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Status row */}
        <div className={cn("flex items-center mt-0.5", isCurrentUser ? "flex-row-reverse" : "flex-row")}>
          {message.status === "failed" && <span className="text-[10px] text-red-400">Failed · tap to retry</span>}
          {message.status === "sending" && <span className="text-[10px] text-gray-400">Sending…</span>}
          {isCurrentUser && message.status !== "failed" && message.status !== "sending" && <ReadIcon />}
        </div>
      </div>
    </div>
  );
});
ChatMessageBody.displayName = "ChatMessageBody";
export default ChatMessageBody;

// ─── Voice Note Player ────────────────────────────────────────────────────────
const VoiceNotePlayer = memo(({ src, isCurrentUser }: { src: string; isCurrentUser: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setIsPlaying(!isPlaying);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className={cn("flex items-center gap-2 my-1 rounded-lg px-2 py-1.5 min-w-[180px]", isCurrentUser ? "bg-primary/10" : "bg-black/5 dark:bg-white/5")}>
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          if (audioRef.current) setProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100);
        }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }}
      />
      <button onClick={toggle} className={cn("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center", isCurrentUser ? "bg-primary text-white" : "bg-foreground/10 text-foreground")}>
        {isPlaying ? <Pause size={12} /> : <Play size={12} className="ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-current rounded-full transition-all" style={{ width: `${progress}%`, opacity: 0.6 }} />
        </div>
        <span className="text-[10px] text-muted-foreground">{isPlaying ? fmt((progress / 100) * duration) : fmt(duration)}</span>
      </div>
      <span className="text-[10px] text-muted-foreground flex-shrink-0">🎤</span>
    </div>
  );
});
VoiceNotePlayer.displayName = "VoiceNotePlayer";

// ─── File Attachment ──────────────────────────────────────────────────────────
const FileAttachment = memo(({ file, isCurrentUser }: { file: { name: string; type: string; size: number; data: string }; isCurrentUser: boolean }) => {
  const fmtSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = file.data;
    a.download = file.name;
    a.click();
  };

  const isImage = file.type.startsWith("image/");

  if (isImage) {
    return (
      <div className="my-1">
        <img src={file.data} alt={file.name} className="rounded-lg max-w-xs cursor-pointer hover:opacity-95" onClick={handleDownload} />
        <p className="text-[10px] text-muted-foreground mt-0.5">{file.name}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 my-1 rounded-lg px-3 py-2 border", isCurrentUser ? "bg-primary/10 border-primary/20" : "bg-black/5 dark:bg-white/5 border-border")}>
      <div className="flex-shrink-0">
        <FileText size={20} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{file.name}</p>
        <p className="text-[10px] text-muted-foreground">{fmtSize(file.size)} · {file.type.split("/")[1]?.toUpperCase()}</p>
      </div>
      <button onClick={handleDownload} className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
        <Download size={14} className="text-muted-foreground" />
      </button>
    </div>
  );
});
FileAttachment.displayName = "FileAttachment";
