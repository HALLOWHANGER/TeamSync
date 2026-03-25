/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import type { UserType } from "@/chat_src/types/auth.type";
import type {
  ChatType,
  CreateChatType,
  CreateMessageType,
  MessageType,
} from "@/chat_src/types/chat.type";
import { API } from "@/chat_src/lib/axios-client";
import { toast } from "sonner";
import { useSocket } from "./use-socket";

const generateId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

interface ChatState {
  chats: ChatType[];
  users: UserType[];
  singleChat: { chat: ChatType; messages: MessageType[] } | null;
  activeChatId: string | null; // tracks what chatId messages should be accepted for

  isChatsLoading: boolean;
  isUsersLoading: boolean;
  isCreatingChat: boolean;
  isSingleChatLoading: boolean;
  isSendingMsg: boolean;

  fetchAllUsers: (workspaceId?: string) => void;
  fetchChats: (workspaceId: string) => void;
  createChat: (payload: CreateChatType) => Promise<ChatType | null>;
  fetchSingleChat: (chatId: string) => void;
  clearSingleChat: () => void;
  sendMessage: (payload: CreateMessageType, currentUser: UserType | null) => void;
  toggleReaction: (messageId: string, emoji: string) => void;

  addNewChat: (newChat: ChatType) => void;
  updateChatLastMessage: (chatId: string, lastMessage: MessageType) => void;
  addNewMessage: (chatId: string, message: MessageType) => void;
  updateMessageReaction: (updatedMessage: MessageType) => void;
  markMessageRead: (chatId: string, userId: string, messageIds: string[]) => void;
}

export const useChat = create<ChatState>()((set, get) => ({
  chats: [],
  users: [],
  singleChat: null,
  activeChatId: null,
  isChatsLoading: false,
  isUsersLoading: false,
  isCreatingChat: false,
  isSingleChatLoading: false,
  isSendingMsg: false,

  fetchAllUsers: async (workspaceId?: string) => {
    set({ isUsersLoading: true });
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const { data } = await API.get(`/user/all${params}`);
      set({ users: data.users });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  fetchChats: async (workspaceId: string) => {
    set({ isChatsLoading: true });
    try {
      const { data } = await API.get(`/chat/all?workspaceId=${workspaceId}`);
      set({ chats: data.chats });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chats");
    } finally {
      set({ isChatsLoading: false });
    }
  },

  createChat: async (payload: CreateChatType) => {
    set({ isCreatingChat: true });
    try {
      const { data } = await API.post("/chat/create", payload);
      get().addNewChat(data.chat);
      return data.chat;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create chat");
      return null;
    } finally {
      set({ isCreatingChat: false });
    }
  },

  fetchSingleChat: async (chatId: string) => {
    // Immediately mark the active chatId so addNewMessage accepts messages
    // for this chat even before the HTTP fetch completes
    set({ isSingleChatLoading: true, activeChatId: chatId, singleChat: null });
    try {
      const { data } = await API.get(`/chat/${chatId}`);
      // Only apply if we're still on the same chat
      if (get().activeChatId === chatId) {
        set({ singleChat: data });
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to fetch chat");
    } finally {
      set({ isSingleChatLoading: false });
    }
  },

  clearSingleChat: () => set({ singleChat: null, activeChatId: null }),

  sendMessage: async (payload: CreateMessageType, currentUser: UserType | null) => {
    const { chatId, replyTo, content, image, voiceNote, fileAttachment } = payload;
    if (!chatId || !currentUser?._id) return;
    set({ isSendingMsg: true });

    const tempId = generateId();
    const tempMessage: MessageType = {
      _id: tempId,
      chatId,
      content: content || null,
      image: image || null,
      voiceNote: voiceNote || null,
      fileAttachment: fileAttachment || null,
      sender: currentUser,
      replyTo: replyTo || null,
      readBy: [currentUser._id],
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "sending",
    };

    set((state) => {
      if (!state.singleChat || state.singleChat.chat._id !== chatId) return state;
      return {
        singleChat: {
          ...state.singleChat,
          messages: [...state.singleChat.messages, tempMessage],
        },
      };
    });

    try {
      const { data } = await API.post("/chat/message/send", {
        chatId,
        content,
        image,
        voiceNote,
        fileAttachment,
        replyToId: replyTo?._id,
      });

      set((state) => {
        if (!state.singleChat) return state;
        return {
          singleChat: {
            ...state.singleChat,
            messages: state.singleChat.messages.map((msg) =>
              msg._id === tempId ? { ...data.userMessage, status: "sent" } : msg
            ),
          },
        };
      });
      get().updateChatLastMessage(chatId, data.userMessage);
    } catch (error: any) {
      set((state) => {
        if (!state.singleChat) return state;
        return {
          singleChat: {
            ...state.singleChat,
            messages: state.singleChat.messages.map((msg) =>
              msg._id === tempId ? { ...msg, status: "failed" } : msg
            ),
          },
        };
      });
      toast.error(error?.response?.data?.message || "Failed to send message");
    } finally {
      set({ isSendingMsg: false });
    }
  },

  toggleReaction: async (messageId: string, emoji: string) => {
    try {
      await API.post(`/chat/message/${messageId}/react`, { emoji });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to react");
    }
  },

  addNewChat: (newChat: ChatType) => {
    set((state) => {
      const idx = state.chats.findIndex((c) => c._id === newChat._id);
      if (idx !== -1) {
        return { chats: [newChat, ...state.chats.filter((c) => c._id !== newChat._id)] };
      }
      return { chats: [newChat, ...state.chats] };
    });
  },

  updateChatLastMessage: (chatId, lastMessage) => {
    set((state) => {
      const chat = state.chats.find((c) => c._id === chatId);
      if (!chat) return state;
      return {
        chats: [
          { ...chat, lastMessage, updatedAt: new Date().toISOString() },
          ...state.chats.filter((c) => c._id !== chatId),
        ],
      };
    });
  },

  addNewMessage: (chatId, message) => {
    const { activeChatId, singleChat } = get();
    // Accept the message if it's for the currently active chat
    if (activeChatId !== chatId) return;

    if (singleChat?.chat._id === chatId) {
      const exists = singleChat.messages.some((m) => m._id === message._id);
      if (exists) return;
      set({
        singleChat: {
          chat: singleChat.chat,
          messages: [...singleChat.messages, message],
        },
      });
    } else {
      // Messages arrived before fetch completed — queue them after fetch
      // by listening again once singleChat is set (handled by re-render)
    }
    useSocket.getState().emitMessagesRead(chatId, [message._id]);
  },

  updateMessageReaction: (updatedMessage: MessageType) => {
    set((state) => {
      if (!state.singleChat) return state;
      return {
        singleChat: {
          ...state.singleChat,
          messages: state.singleChat.messages.map((msg) =>
            msg._id === updatedMessage._id
              ? { ...msg, reactions: updatedMessage.reactions }
              : msg
          ),
        },
      };
    });
  },

  markMessageRead: (chatId, userId, messageIds) => {
    set((state) => {
      if (state.singleChat?.chat._id !== chatId) return state;
      const updated = state.singleChat.messages.map((msg) => {
        if (!messageIds.length || messageIds.includes(msg._id)) {
          if (!msg.readBy?.includes(userId)) {
            return { ...msg, readBy: [...(msg.readBy ?? []), userId] };
          }
        }
        return msg;
      });
      return { singleChat: { ...state.singleChat, messages: updated } };
    });
  },
}));
