import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import {
  createChatService,
  getAllChatsService,
  getAllUsersService,
  getSingleChatService,
  markMessagesReadService,
  sendMessageService,
  toggleReactionService,
} from "../services/chat.service";
import { io } from "../index";

export const getAllUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const workspaceId = req.query.workspaceId as string | undefined;
    const users = await getAllUsersService(currentUserId, workspaceId);
    return res.status(HTTPSTATUS.OK).json({ users });
  }
);

export const createChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const chat = await createChatService(currentUserId, req.body);

    // Notify all participants
    chat.participants.forEach((p: any) => {
      io.emit("chat:new", chat);
    });

    return res.status(HTTPSTATUS.CREATED).json({ chat });
  }
);

export const getAllChatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "workspaceId required" });
    }
    const chats = await getAllChatsService(currentUserId, workspaceId);
    return res.status(HTTPSTATUS.OK).json({ chats });
  }
);

export const getSingleChatController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { chatId } = req.params;
    const data = await getSingleChatService(chatId, currentUserId);
    return res.status(HTTPSTATUS.OK).json(data);
  }
);

export const sendMessageController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const userMessage = await sendMessageService(currentUserId, req.body);

    const { chatId } = req.body;
    // Push to room in real-time
    io.to(chatId).emit("message:new", userMessage);
    io.emit("chat:update", { chatId, lastMessage: userMessage });

    return res.status(HTTPSTATUS.CREATED).json({ userMessage });
  }
);

export const toggleReactionController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "emoji required" });
    }

    const updatedMessage = await toggleReactionService(messageId, currentUserId, emoji);

    // Broadcast reaction update to chat room
    io.to(updatedMessage.chatId.toString()).emit("message:reaction", updatedMessage);

    return res.status(HTTPSTATUS.OK).json({ message: updatedMessage });
  }
);

export const markMessagesReadController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const { chatId } = req.params;
    await markMessagesReadService(chatId, currentUserId);
    return res.status(HTTPSTATUS.OK).json({ success: true });
  }
);

export const bootstrapWorkspaceChatsController = asyncHandler(
  async (req: Request, res: Response) => {
    const currentUserId = req.user?._id?.toString()!;
    const workspaceId = req.query.workspaceId as string;
    if (!workspaceId) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "workspaceId required" });
    }

    const { onMemberJoinWorkspace, ensureWorkspaceGroupChat } = await import("../services/chat.service");
    const WorkspaceModel = (await import("../models/workspace.model")).default;

    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) {
      return res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Workspace not found" });
    }

    // Ensure the workspace-wide group chat exists
    await ensureWorkspaceGroupChat(workspaceId, workspace.owner.toString());

    // Ensure this user has a DM with the owner (if they're not the owner)
    if (currentUserId !== workspace.owner.toString()) {
      await onMemberJoinWorkspace(workspaceId, currentUserId);
    }

    return res.status(HTTPSTATUS.OK).json({ success: true });
  }
);
