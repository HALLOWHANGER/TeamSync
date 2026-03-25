import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { useSocket } from "@/chat_src/hooks/use-socket";
import type { ChatType } from "@/chat_src/types/chat.type";

export const isUserOnline = (userId?: string): boolean => {
  if (!userId) return false;
  const { onlineUsers } = useSocket.getState();
  return onlineUsers.includes(userId);
};

export const getOtherUserAndGroup = (
  chat: ChatType,
  currentUserId: string | null
) => {
  const isGroup = chat?.isGroup;

  if (isGroup) {
    return {
      name: chat.groupName || "Unnamed Group",
      subheading: `${chat.participants.length} members`,
      avatar: "",
      isGroup: true,
      isOnline: false,
    };
  }

  const other = chat?.participants.find((p) => p._id !== currentUserId);
  const isOnline = isUserOnline(other?._id ?? "");

  return {
    name: other?.name || "Unknown",
    subheading: isOnline ? "Online" : "Offline",
    avatar: other?.avatar || "",
    isGroup: false,
    isOnline,
  };
};

export const formatChatTime = (date: string | Date | undefined): string => {
  if (!date) return "";
  const newDate = new Date(date);
  if (isNaN(newDate.getTime())) return "";

  if (isToday(newDate)) return format(newDate, "h:mm a");
  if (isYesterday(newDate)) return "Yesterday";
  if (isThisWeek(newDate)) return format(newDate, "EEEE");
  return format(newDate, "M/d");
};
