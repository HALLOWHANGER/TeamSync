import ChatBody from "@/chat_src/components/chat/chat-body";
import ChatFooter from "@/chat_src/components/chat/chat-footer";
import ChatHeader from "@/chat_src/components/chat/chat-header";
import EmptyState from "@/chat_src/components/empty-state";
import { Spinner } from "@/chat_src/components/ui/spinner";
import { useChat } from "@/chat_src/hooks/use-chat";
import { useSocket } from "@/chat_src/hooks/use-socket";
import { useAuthContext } from "@/context/auth-provider";
import type { MessageType } from "@/chat_src/types/chat.type";
import type { UserType } from "@/chat_src/types/auth.type";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const SingleChat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { fetchSingleChat, clearSingleChat, isSingleChatLoading, singleChat } = useChat();
  const { socket } = useSocket();
  const { user: authUser } = useAuthContext();

  const [replyTo, setReplyTo] = useState<MessageType | null>(null);

  const currentUser: UserType | null = authUser
    ? {
        _id: authUser._id,
        name: authUser.name,
        email: authUser.email,
        avatar: (authUser as any).profilePicture ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    : null;

  const currentUserId = currentUser?._id || null;
  const chat = singleChat?.chat;
  const messages = singleChat?.messages || [];

  // When chatId changes: clear stale data, fetch fresh, join new room
  useEffect(() => {
    if (!chatId) return;
    clearSingleChat();
    fetchSingleChat(chatId);
  }, [chatId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join / leave socket room
  useEffect(() => {
    if (!chatId || !socket) return;
    socket.emit("chat:join", chatId);
    return () => { socket.emit("chat:leave", chatId); };
  }, [chatId, socket]);

  if (isSingleChatLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner className="w-11 h-11 !text-primary" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          title="No chat selected"
          description="Pick a chat from the list or start a new one"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={chat} currentUserId={currentUserId} />

      <div className="flex-1 overflow-y-auto bg-background">
        {messages.length === 0 ? (
          <EmptyState
            title="Start a conversation"
            description="No messages yet. Send the first one!"
          />
        ) : (
          <ChatBody
            chatId={chatId ?? null}
            messages={messages}
            onReply={setReplyTo}
            currentUserId={currentUserId}
          />
        )}
      </div>

      <ChatFooter
        replyTo={replyTo}
        chatId={chatId ?? null}
        currentUserId={currentUserId}
        currentUser={currentUser}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default SingleChat;
