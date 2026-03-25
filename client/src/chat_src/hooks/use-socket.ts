import { io, Socket } from "socket.io-client";
import { create } from "zustand";

const BASE_URL =
  import.meta.env.MODE === "development" ? import.meta.env.VITE_SOCKET_URL : "/";

interface TypingUser {
  chatId: string;
  userId: string;
}

interface SocketState {
  socket: Socket | null;
  onlineUsers: string[];
  typingUsers: TypingUser[];
  connectSocket: (userId?: string) => void;
  disconnectSocket: () => void;
  emitTypingStart: (chatId: string) => void;
  emitTypingStop: (chatId: string) => void;
  emitMessagesRead: (chatId: string, messageIds?: string[]) => void;
}

export const useSocket = create<SocketState>()((set, get) => ({
  socket: null,
  onlineUsers: [],
  typingUsers: [],

  connectSocket: (userId?: string) => {
    const { socket } = get();
    if (socket?.connected) return;

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      autoConnect: true,
      query: userId ? { userId } : undefined,
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("Socket connected", newSocket.id);
    });

    newSocket.on("online:users", (userIds: string[]) => {
      set({ onlineUsers: userIds });
    });

    newSocket.on("typing:start", ({ chatId, userId }: TypingUser) => {
      set((state) => {
        const already = state.typingUsers.some(
          (t) => t.chatId === chatId && t.userId === userId
        );
        if (already) return state;
        return { typingUsers: [...state.typingUsers, { chatId, userId }] };
      });
    });

    newSocket.on("typing:stop", ({ chatId, userId }: TypingUser) => {
      set((state) => ({
        typingUsers: state.typingUsers.filter(
          (t) => !(t.chatId === chatId && t.userId === userId)
        ),
      }));
    });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [], typingUsers: [] });
    }
  },

  emitTypingStart: (chatId: string) => {
    get().socket?.emit("typing:start", chatId);
  },

  emitTypingStop: (chatId: string) => {
    get().socket?.emit("typing:stop", chatId);
  },

  emitMessagesRead: (chatId: string, messageIds?: string[]) => {
    get().socket?.emit("messages:read", { chatId, messageIds: messageIds ?? [] });
  },
}));
