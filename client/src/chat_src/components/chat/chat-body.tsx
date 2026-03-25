import { useChat } from "@/chat_src/hooks/use-chat";
import { useSocket } from "@/chat_src/hooks/use-socket";
import type { MessageType } from "@/chat_src/types/chat.type";
import { useEffect, useRef } from "react";
import ChatBodyMessage from "./chat-body-message";

interface Props {
  chatId: string | null;
  messages: MessageType[];
  onReply: (message: MessageType) => void;
  currentUserId: string | null;
}

const ChatBody = ({ chatId, messages, onReply, currentUserId }: Props) => {
  const { socket, emitMessagesRead } = useSocket();
  const { addNewMessage, markMessageRead, updateMessageReaction } = useChat();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // New messages via socket
  useEffect(() => {
    if (!chatId || !socket) return;
    const handleNewMessage = (msg: MessageType) => addNewMessage(chatId, msg);
    socket.on("message:new", handleNewMessage);
    return () => { socket.off("message:new", handleNewMessage); };
  }, [socket, chatId, addNewMessage]);

  // Reaction updates via socket
  useEffect(() => {
    if (!chatId || !socket) return;
    const handleReaction = (msg: MessageType) => updateMessageReaction(msg);
    socket.on("message:reaction", handleReaction);
    return () => { socket.off("message:reaction", handleReaction); };
  }, [socket, chatId, updateMessageReaction]);

  // Read receipt updates
  useEffect(() => {
    if (!chatId || !socket) return;
    const handleRead = ({ chatId: rChatId, userId, messageIds }: { chatId: string; userId: string; messageIds: string[] }) => {
      if (rChatId === chatId) markMessageRead(chatId, userId, messageIds);
    };
    socket.on("messages:read", handleRead);
    return () => { socket.off("messages:read", handleRead); };
  }, [socket, chatId, markMessageRead]);

  // Mark visible messages as read
  useEffect(() => {
    if (!chatId || !messages.length || !currentUserId) return;
    const unread = messages
      .filter((m) => m.sender?._id !== currentUserId && !m.readBy?.includes(currentUserId))
      .map((m) => m._id);
    if (unread.length > 0) emitMessagesRead(chatId, unread);
  }, [chatId, messages, currentUserId, emitMessagesRead]);

  // Auto-scroll
  useEffect(() => {
    if (!messages.length) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col px-3 py-2">
      {messages.map((message) => (
        <ChatBodyMessage
          key={message._id}
          message={message}
          onReply={onReply}
          currentUserId={currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatBody;
