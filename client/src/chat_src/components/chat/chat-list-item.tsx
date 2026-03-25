import { getOtherUserAndGroup } from "@/chat_src/lib/helper";
import { cn } from "@/chat_src/lib/utils";
import type { ChatType } from "@/chat_src/types/chat.type";
import { useLocation } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";
import { formatChatTime } from "@/chat_src/lib/helper";

interface PropsType {
  chat: ChatType;
  currentUserId: string | null;
  onClick?: () => void;
}

const ChatListItem = ({ chat, currentUserId, onClick }: PropsType) => {
  const { pathname } = useLocation();
  const { lastMessage, createdAt } = chat;
  const { name, avatar, isOnline, isGroup } = getOtherUserAndGroup(chat, currentUserId);

  const getLastMessageText = () => {
    if (!lastMessage) {
      return isGroup ? (chat.createdBy === currentUserId ? "Group created" : "You were added") : "Send a message";
    }
    if (lastMessage.voiceNote) return "🎤 Voice note";
    if (lastMessage.fileAttachment) return `📎 ${lastMessage.fileAttachment.name}`;
    if (lastMessage.image) return "📷 Photo";
    if (isGroup && lastMessage.sender) {
      return `${lastMessage.sender._id === currentUserId ? "You" : lastMessage.sender.name}: ${lastMessage.content}`;
    }
    return lastMessage.content;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        `w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-sidebar-accent transition-colors text-left`,
        pathname.includes(chat._id) && "!bg-sidebar-accent"
      )}
    >
      <AvatarWithBadge name={name} src={avatar} isGroup={isGroup} isOnline={isOnline} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h5 className="text-sm font-semibold truncate">{name}</h5>
            {chat.isWorkspaceGroup && (
              <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded-sm font-medium flex-shrink-0">ALL</span>
            )}
          </div>
          <span className="text-[11px] ml-2 shrink-0 text-muted-foreground">
            {formatChatTime(lastMessage?.updatedAt || createdAt)}
          </span>
        </div>
        <p className="text-xs truncate text-muted-foreground">{getLastMessageText()}</p>
      </div>
    </button>
  );
};

export default ChatListItem;
