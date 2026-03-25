import type { MessageType } from "@/chat_src/types/chat.type";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface Props {
  replyTo: MessageType | null;
  currentUserId: string | null;
  onCancel: () => void;
}

const ChatReplyBar = ({ replyTo, currentUserId, onCancel }: Props) => {
  if (!replyTo) return null;

  const senderName = replyTo.sender?._id === currentUserId ? "You" : replyTo.sender?.name;

  const previewText = () => {
    if (replyTo.voiceNote) return "🎤 Voice note";
    if (replyTo.fileAttachment) return `📎 ${replyTo.fileAttachment.name}`;
    if (replyTo.image) return "📷 Photo";
    return replyTo.content || "";
  };

  return (
    <div className="bg-card border-t px-6 pt-2 pb-1 animate-in slide-in-from-bottom">
      <div className="flex items-start justify-between p-2.5 text-sm border-l-4 border-l-primary bg-primary/10 rounded-md shadow-sm">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-xs text-primary">{senderName}</h5>
          <p className="text-muted-foreground truncate text-xs mt-0.5">{previewText()}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="shrink-0 h-6 w-6 ml-2">
          <X size={13} />
        </Button>
      </div>
    </div>
  );
};

export default ChatReplyBar;
