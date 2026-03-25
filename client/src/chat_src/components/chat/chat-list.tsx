import { useEffect, useRef, useState } from "react";
import { useChat } from "@/chat_src/hooks/use-chat";
import { Spinner } from "../ui/spinner";
import ChatListItem from "./chat-list-item";
import { useNavigate, useParams } from "react-router-dom";
import ChatListHeader from "./chat-list-header";
import { useSocket } from "@/chat_src/hooks/use-socket";
import type { ChatType, MessageType } from "@/chat_src/types/chat.type";
import { useAuthContext } from "@/context/auth-provider";
import { API } from "@/chat_src/lib/axios-client";

const ChatList = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { socket } = useSocket();
  const { fetchChats, chats, isChatsLoading, addNewChat, updateChatLastMessage } = useChat();
  const { user } = useAuthContext();
  const currentUserId = user?._id || null;
  const bootstrapped = useRef<Record<string, boolean>>({});

  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = (chats ?? []).filter(
    (chat) =>
      chat.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.participants?.some(
        (p) =>
          p._id !== currentUserId &&
          p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  useEffect(() => {
    if (!workspaceId) return;

    const load = async () => {
      // Bootstrap once per workspace per session — creates group chat + DM if missing
      if (!bootstrapped.current[workspaceId]) {
        bootstrapped.current[workspaceId] = true;
        try {
          await API.post(`/chat/bootstrap?workspaceId=${workspaceId}`);
        } catch {
          // Non-fatal — chats may already exist
        }
      }
      fetchChats(workspaceId);
    };

    load();
  }, [workspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Socket: new chat
  useEffect(() => {
    if (!socket) return;
    const handleNewChat = (newChat: ChatType) => addNewChat(newChat);
    socket.on("chat:new", handleNewChat);
    return () => { socket.off("chat:new", handleNewChat); };
  }, [socket, addNewChat]);

  // Socket: last message update
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = (data: { chatId: string; lastMessage: MessageType }) =>
      updateChatLastMessage(data.chatId, data.lastMessage);
    socket.on("chat:update", handleUpdate);
    return () => { socket.off("chat:update", handleUpdate); };
  }, [socket, updateChatLastMessage]);

  const onRoute = (id: string) =>
    navigate(`/workspace/${workspaceId}/chats/${id}`);

  return (
    <div className="w-[300px] lg:w-[340px] xl:w-[370px] flex-shrink-0 h-full border-r border-border bg-sidebar flex flex-col">
      <ChatListHeader onSearch={setSearchQuery} />

      <div className="flex-1 overflow-y-auto">
        <div className="px-2 pt-1 pb-10 space-y-0.5">
          {isChatsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner className="w-7 h-7" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
              <span className="text-2xl">💬</span>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No chats found" : "No chats yet"}
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                currentUserId={currentUserId}
                onClick={() => onRoute(chat._id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatList;
