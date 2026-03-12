import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import session from "express-session";
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";

import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { BadRequestException } from "./utils/appError";
import { ErrorCodeEnum } from "./enums/error-code.enum";

import "./config/passport.config";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";
import chatRoutes from "./routes/chat.route";

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();
const httpServer = http.createServer(app);
const BASE_PATH = config.BASE_PATH;

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  session({
    name: "session",
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: config.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })
);

// ─── REST Routes ─────────────────────────────────────────────────────────────

app.get(
  `/`,
  asyncHandler(async (_req: Request, _res: Response, _next: NextFunction) => {
    throw new BadRequestException(
      "This is a bad request",
      ErrorCodeEnum.AUTH_INVALID_TOKEN
    );
  })
);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);
app.use(`${BASE_PATH}/chat`, isAuthenticated, chatRoutes);

app.use(errorHandler);

// ─── Socket.io ───────────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

/** userId → set of socketIds (user can have multiple tabs) */
const onlineUsers = new Map<string, Set<string>>();
/** socketId → auto-stop typing timer */
const typingTimers = new Map<string, NodeJS.Timeout>();

const broadcastOnlineUsers = () => {
  io.emit("online:users", Array.from(onlineUsers.keys()));
};

io.on("connection", (socket: Socket) => {
  const userId = socket.handshake.query.userId as string | undefined;

  if (userId) {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    broadcastOnlineUsers();
  }

  // ── Room management ────────────────────────────────────────────────────

  socket.on("chat:join", (chatId: string) => {
    socket.join(chatId);
    if (userId) {
      // Notify others the user has read messages
      socket.to(chatId).emit("messages:read", { chatId, userId });
    }
  });

  socket.on("chat:leave", (chatId: string) => {
    socket.leave(chatId);
  });

  // ── Message broadcast ──────────────────────────────────────────────────
  // HTTP handler saves to DB then calls io.emit — this socket event is
  // used by the server-side chat controller after a successful DB write.

  socket.on(
    "message:send",
    (data: { chatId: string; message: Record<string, unknown> }) => {
      socket.to(data.chatId).emit("message:new", data.message);
      io.emit("chat:update", {
        chatId: data.chatId,
        lastMessage: data.message,
      });
    }
  );

  // ── Typing indicators ──────────────────────────────────────────────────

  socket.on("typing:start", (chatId: string) => {
    if (!userId) return;
    clearTimeout(typingTimers.get(socket.id));
    socket.to(chatId).emit("typing:start", { chatId, userId });

    // Auto-stop after 3 s of silence
    typingTimers.set(
      socket.id,
      setTimeout(() => {
        socket.to(chatId).emit("typing:stop", { chatId, userId });
        typingTimers.delete(socket.id);
      }, 3000)
    );
  });

  socket.on("typing:stop", (chatId: string) => {
    if (!userId) return;
    clearTimeout(typingTimers.get(socket.id));
    typingTimers.delete(socket.id);
    socket.to(chatId).emit("typing:stop", { chatId, userId });
  });

  // ── Reactions ──────────────────────────────────────────────────────────
  socket.on("message:reaction", (data: { chatId: string; message: Record<string, unknown> }) => {
    socket.to(data.chatId).emit("message:reaction", data.message);
  });

  // ── Read receipts ──────────────────────────────────────────────────────

  socket.on(
    "messages:read",
    (data: { chatId: string; messageIds?: string[] }) => {
      if (!userId) return;
      socket.to(data.chatId).emit("messages:read", {
        chatId: data.chatId,
        userId,
        messageIds: data.messageIds ?? [],
      });
    }
  );

  // ── Disconnect ─────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    if (userId) {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
      broadcastOnlineUsers();
    }
    clearTimeout(typingTimers.get(socket.id));
    typingTimers.delete(socket.id);
  });
});

export { io };

// ─── Boot ─────────────────────────────────────────────────────────────────────

httpServer.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});
