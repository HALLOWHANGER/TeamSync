import mongoose from "mongoose";
import ChatModel from "../models/chat.model";
import MessageModel from "../models/message.model";
import UserModel from "../models/user.model";
import MemberModel from "../models/member.model";
import WorkspaceModel from "../models/workspace.model";
import { BadRequestException, NotFoundException } from "../utils/appError";

// ─── Populate helpers ────────────────────────────────────────────────────────

const populateChat = (query: mongoose.Query<any, any>) =>
  query
    .populate("participants", "_id name email profilePicture")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "_id name email profilePicture" },
    });

const populateMessage = (query: mongoose.Query<any, any>) =>
  query
    .populate("sender", "_id name email profilePicture")
    .populate({ path: "replyTo", populate: { path: "sender", select: "_id name email profilePicture" } })
    .populate("readBy", "_id name")
    .populate("reactions.userId", "_id name profilePicture");

// ─── Format helpers ──────────────────────────────────────────────────────────

const formatUser = (u: any) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  avatar: u.profilePicture ?? null,
});

const formatReaction = (r: any) => ({
  userId: r.userId?._id ?? r.userId,
  userName: r.userId?.name ?? "",
  emoji: r.emoji,
});

const formatMessage = (msg: any) => ({
  _id: msg._id,
  chatId: msg.chatId,
  content: msg.content ?? null,
  image: msg.image ?? null,
  voiceNote: msg.voiceNote ?? null,
  fileAttachment: msg.fileAttachment ?? null,
  sender: msg.sender ? formatUser(msg.sender) : null,
  replyTo: msg.replyTo
    ? {
        _id: msg.replyTo._id,
        content: msg.replyTo.content ?? null,
        image: msg.replyTo.image ?? null,
        voiceNote: msg.replyTo.voiceNote ?? null,
        fileAttachment: msg.replyTo.fileAttachment ?? null,
        sender: msg.replyTo.sender ? formatUser(msg.replyTo.sender) : null,
      }
    : null,
  reactions: (msg.reactions || []).map(formatReaction),
  readBy: (msg.readBy || []).map((u: any) => u._id?.toString() ?? u.toString()),
  createdAt: msg.createdAt,
  updatedAt: msg.updatedAt,
});

const formatChat = (chat: any) => ({
  _id: chat._id,
  workspaceId: chat.workspaceId,
  isGroup: chat.isGroup,
  isWorkspaceGroup: chat.isWorkspaceGroup ?? false,
  groupName: chat.groupName ?? null,
  createdBy: chat.createdBy,
  participants: (chat.participants || []).map(formatUser),
  lastMessage: chat.lastMessage ? formatMessage(chat.lastMessage) : null,
  createdAt: chat.createdAt,
  updatedAt: chat.updatedAt,
});

// ─── Workspace member helpers ─────────────────────────────────────────────────

export const getWorkspaceMemberIds = async (workspaceId: string): Promise<string[]> => {
  const members = await MemberModel.find({ workspaceId }).select("userId").lean();
  return members.map((m: any) => m.userId.toString());
};

// ─── User list (workspace-scoped) ─────────────────────────────────────────────

export const getAllUsersService = async (currentUserId: string, workspaceId?: string) => {
  let userIds: string[] = [];

  if (workspaceId) {
    userIds = await getWorkspaceMemberIds(workspaceId);
  }

  const query = userIds.length
    ? { _id: { $ne: currentUserId, $in: userIds } }
    : { _id: { $ne: currentUserId } };

  const users = await UserModel.find(query, "_id name email profilePicture").lean();
  return users.map(formatUser);
};

// ─── Workspace group chat ─────────────────────────────────────────────────────

/**
 * Ensures the workspace-wide group chat exists. Creates it if not.
 * Returns the chat document.
 */
export const ensureWorkspaceGroupChat = async (
  workspaceId: string,
  ownerId: string
): Promise<any> => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) throw new NotFoundException("Workspace not found");

  const existing = await ChatModel.findOne({ workspaceId, isWorkspaceGroup: true });
  if (existing) return existing;

  // Get all current members
  const memberIds = await getWorkspaceMemberIds(workspaceId);
  const allParticipants = [...new Set([ownerId, ...memberIds])];

  const chat = await ChatModel.create({
    workspaceId,
    participants: allParticipants,
    isGroup: true,
    isWorkspaceGroup: true,
    groupName: `${workspace.name} — Everyone`,
    createdBy: ownerId,
  });

  return chat;
};

/**
 * Adds a new member to the workspace group chat (if it exists).
 * Also creates a welcome DM from the workspace owner.
 */
export const onMemberJoinWorkspace = async (
  workspaceId: string,
  newUserId: string
): Promise<void> => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) return;

  const ownerId = workspace.owner.toString();

  // 1. Add to workspace group chat
  let groupChat = await ChatModel.findOne({ workspaceId, isWorkspaceGroup: true });

  if (!groupChat) {
    groupChat = await ensureWorkspaceGroupChat(workspaceId, ownerId);
  } else {
    // Add if not already a participant
    const alreadyIn = groupChat.participants.some(
      (p: any) => p.toString() === newUserId
    );
    if (!alreadyIn) {
      groupChat.participants.push(new mongoose.Types.ObjectId(newUserId));
      await groupChat.save();
    }
  }

  // 2. Create welcome DM from workspace owner
  const existingDM = await ChatModel.findOne({
    workspaceId,
    isGroup: false,
    participants: { $all: [ownerId, newUserId], $size: 2 },
  });

  if (!existingDM) {
    const dm = await ChatModel.create({
      workspaceId,
      participants: [ownerId, newUserId],
      isGroup: false,
      isWorkspaceGroup: false,
      createdBy: ownerId,
    });

    // Welcome message
    const welcomeMsg = await MessageModel.create({
      chatId: dm._id,
      sender: ownerId,
      content: `👋 Welcome to ${workspace.name}! Happy to have you on the team.`,
      readBy: [ownerId],
      reactions: [],
    });

    dm.lastMessage = welcomeMsg._id as mongoose.Types.ObjectId;
    await dm.save();
  }
};

// ─── Chat CRUD ────────────────────────────────────────────────────────────────

export const createChatService = async (
  currentUserId: string,
  payload: {
    workspaceId: string;
    participantId?: string;
    isGroup?: boolean;
    participants?: string[];
    groupName?: string;
  }
) => {
  const { workspaceId, participantId, isGroup, participants, groupName } = payload;

  if (!workspaceId) throw new BadRequestException("workspaceId required");

  if (!isGroup) {
    if (!participantId) throw new BadRequestException("participantId required");

    const existing = await ChatModel.findOne({
      workspaceId,
      isGroup: false,
      participants: { $all: [currentUserId, participantId], $size: 2 },
    });

    if (existing) {
      const populated = await populateChat(ChatModel.findById(existing._id));
      return formatChat(populated);
    }

    const chat = await ChatModel.create({
      workspaceId,
      participants: [currentUserId, participantId],
      isGroup: false,
      createdBy: currentUserId,
    });
    const populated = await populateChat(ChatModel.findById(chat._id));
    return formatChat(populated);
  }

  // Custom group chat
  if (!groupName?.trim()) throw new BadRequestException("groupName required");
  if (!participants?.length) throw new BadRequestException("participants required");

  const allParticipants = [...new Set([currentUserId, ...participants])];
  const chat = await ChatModel.create({
    workspaceId,
    participants: allParticipants,
    isGroup: true,
    isWorkspaceGroup: false,
    groupName: groupName.trim(),
    createdBy: currentUserId,
  });
  const populated = await populateChat(ChatModel.findById(chat._id));
  return formatChat(populated);
};

export const getAllChatsService = async (currentUserId: string, workspaceId: string) => {
  const chats = await populateChat(
    ChatModel.find({ workspaceId, participants: currentUserId }).sort({ updatedAt: -1 })
  );
  return chats.map(formatChat);
};

export const getSingleChatService = async (chatId: string, currentUserId: string) => {
  const chat = await populateChat(ChatModel.findById(chatId));
  if (!chat) throw new NotFoundException("Chat not found");

  const isMember = chat.participants.some((p: any) => p._id.toString() === currentUserId);
  if (!isMember) throw new BadRequestException("Not a member of this chat");

  const rawMessages = await populateMessage(
    MessageModel.find({ chatId }).sort({ createdAt: 1 })
  );

  return { chat: formatChat(chat), messages: rawMessages.map(formatMessage) };
};

// ─── Messaging ────────────────────────────────────────────────────────────────

export const sendMessageService = async (
  currentUserId: string,
  payload: {
    chatId: string;
    content?: string;
    image?: string;
    voiceNote?: string;
    fileAttachment?: { name: string; type: string; size: number; data: string };
    replyToId?: string;
  }
) => {
  const { chatId, content, image, voiceNote, fileAttachment, replyToId } = payload;

  const hasContent = content?.trim() || image || voiceNote || fileAttachment;
  if (!hasContent) throw new BadRequestException("Message content required");

  const chat = await ChatModel.findById(chatId);
  if (!chat) throw new NotFoundException("Chat not found");

  const replyTo = replyToId ? await MessageModel.findById(replyToId) : undefined;

  const message = await MessageModel.create({
    chatId,
    sender: currentUserId,
    content: content?.trim() || undefined,
    image: image || undefined,
    voiceNote: voiceNote || undefined,
    fileAttachment: fileAttachment || undefined,
    replyTo: replyTo?._id ?? null,
    readBy: [currentUserId],
    reactions: [],
  });

  chat.lastMessage = message._id as mongoose.Types.ObjectId;
  await chat.save();

  const populated = await populateMessage(MessageModel.findById(message._id));
  return formatMessage(populated);
};

// ─── Reactions ────────────────────────────────────────────────────────────────

export const toggleReactionService = async (
  messageId: string,
  userId: string,
  emoji: string
) => {
  const message = await MessageModel.findById(messageId);
  if (!message) throw new NotFoundException("Message not found");

  const existingIdx = message.reactions.findIndex(
    (r) => r.userId.toString() === userId && r.emoji === emoji
  );

  if (existingIdx !== -1) {
    // Remove reaction
    message.reactions.splice(existingIdx, 1);
  } else {
    // Add reaction (also remove any other emoji from this user — 1 reaction per user)
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId
    );
    message.reactions.push({ userId: new mongoose.Types.ObjectId(userId), emoji });
  }

  await message.save();
  const populated = await populateMessage(MessageModel.findById(message._id));
  return formatMessage(populated);
};

// ─── Read receipts ────────────────────────────────────────────────────────────

export const markMessagesReadService = async (chatId: string, userId: string) => {
  await MessageModel.updateMany(
    { chatId, readBy: { $nin: [userId] } },
    { $addToSet: { readBy: userId } }
  );
};
