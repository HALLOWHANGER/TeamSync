import { getOtherUserAndGroup } from "@/chat_src/lib/helper";
import type { ChatType } from "@/chat_src/types/chat.type";
import { useSocket } from "@/chat_src/hooks/use-socket";
import { ArrowLeft, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AvatarWithBadge from "../avatar-with-badge";

interface Props {
  chat: ChatType;
  currentUserId: string | null;
}

const ChatHeader = ({ chat, currentUserId }: Props) => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { typingUsers } = useSocket();

  const { name, subheading, avatar, isOnline, isGroup } = getOtherUserAndGroup(chat, currentUserId);

  const typingInChat = typingUsers.filter((t) => t.chatId === chat._id);
  const typingText =
    typingInChat.length === 1
      ? "typing…"
      : typingInChat.length > 1
      ? "several people are typing…"
      : null;

  const handleBack = () => {
    if (workspaceId) navigate(`/workspace/${workspaceId}/chats`);
    else navigate(-1);
  };

  return (
    <div className="sticky top-0 flex items-center gap-3 border-b border-border bg-card px-2 z-50 h-14">
      <button onClick={handleBack} className="ml-2 lg:hidden flex-shrink-0">
        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
      </button>

      <AvatarWithBadge name={name} src={avatar} isGroup={isGroup} isOnline={isOnline} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h5 className="font-semibold truncate">{name}</h5>
          {chat.isWorkspaceGroup && (
            <span className="flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">
              <Users size={10} /> Everyone
            </span>
          )}
        </div>
        {typingText ? (
          <p className="text-xs text-green-500 flex items-center gap-1">
            <TypingDots />
            {typingText}
          </p>
        ) : (
          <p className={`text-xs ${isOnline ? "text-green-500" : "text-muted-foreground"}`}>
            {subheading}
          </p>
        )}
      </div>
    </div>
  );
};

const TypingDots = () => (
  <span className="flex items-center gap-0.5">
    {[0, 1, 2].map((i) => (
      <span key={i} className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </span>
);

export default ChatHeader;
