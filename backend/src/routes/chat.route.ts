import { Router } from "express";
import {
  bootstrapWorkspaceChatsController,
  createChatController,
  getAllChatsController,
  getAllUsersController,
  getSingleChatController,
  markMessagesReadController,
  sendMessageController,
  toggleReactionController,
} from "../controllers/chat.controller";

const chatRoutes = Router();

// Bootstrap — ensures workspace group chat + owner DM exist for current user
chatRoutes.post("/bootstrap", bootstrapWorkspaceChatsController);

// Users (workspace-scoped for new chat popover)
chatRoutes.get("/users", getAllUsersController);

// Chats
chatRoutes.get("/all", getAllChatsController);
chatRoutes.post("/create", createChatController);
chatRoutes.get("/:chatId", getSingleChatController);

// Messages
chatRoutes.post("/message/send", sendMessageController);
chatRoutes.put("/:chatId/read", markMessagesReadController);

// Reactions
chatRoutes.post("/message/:messageId/react", toggleReactionController);

export default chatRoutes;
