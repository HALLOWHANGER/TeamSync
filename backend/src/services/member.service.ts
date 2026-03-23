import mongoose from "mongoose";
import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Roles } from "../enums/role.enum";
import MemberModel from "../models/member.model";
import RoleModel from "../models/roles-permission.model";
import WorkspaceModel from "../models/workspace.model";
import PendingModel from "../models/pending.model";
import PendingMemberModel from "../models/pending.member.model";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";
import { onMemberJoinWorkspace } from "./chat.service";

export const PendingStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  DENIED: "DENIED",
} as const;

export type PendingStatusType = (typeof PendingStatus)[keyof typeof PendingStatus];

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) throw new NotFoundException("Workspace not found");

  const member = await MemberModel.findOne({ userId, workspaceId }).populate("role");
  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  return { role: member.role?.name };
};

export const joinWorkspaceByInviteService = async (__id: string) => {
  const pendingUser = await PendingMemberModel.findById(__id).exec();
  if (!pendingUser) throw new NotFoundException("Invalid invite code or workspace not found");

  const workspace = await WorkspaceModel.findOne({ _id: pendingUser.workspaceId }).exec();
  if (!workspace) throw new NotFoundException("Invalid invite code or workspace not found");

  const existingMember = await MemberModel.findOne({
    userId: pendingUser.userId,
    workspaceId: workspace._id,
  }).exec();
  if (existingMember) throw new BadRequestException("You are already a member of this workspace");

  const role = await RoleModel.findOne({ name: Roles.MEMBER });
  if (!role) throw new NotFoundException("Role not found");

  const newMember = new MemberModel({
    userId: pendingUser.userId,
    workspaceId: workspace._id,
    role: role._id,
  });
  await newMember.save();

  await PendingMemberModel.updateOne({ _id: __id }, { $set: { status: "APPROVED" } });

  // ── Auto-add to workspace group chat + send welcome DM ──────────────────
  try {
    await onMemberJoinWorkspace(
      (workspace._id as mongoose.Types.ObjectId).toString(),
      pendingUser.userId.toString()
    );
  } catch (e) {
    console.error("Could not run chat onboarding for new member:", e);
  }

  return { workspaceId: workspace._id, role: role.name };
};

export const DeclineWorkspaceByInviteService = async (__id: string) => {
  await PendingMemberModel.updateOne({ _id: __id }, { $set: { status: "DENIED" } });
};

export const joinWorkspacePendingService = async (
  userId: string,
  inviteCode: string
) => {
  const workspace = await WorkspaceModel.findOne({ inviteCode }).exec();
  if (!workspace) throw new NotFoundException("Invalid invite code or workspace not found");

  const existingMember = await MemberModel.findOne({
    userId,
    workspaceId: workspace._id,
  }).exec();
  if (existingMember) throw new BadRequestException("You are already a member of this workspace");

  const role = await RoleModel.findOne({ name: Roles.MEMBER });
  if (!role) throw new NotFoundException("Role not found");

  const newPending = new PendingMemberModel({
    userId,
    workspaceId: workspace._id,
    role: role._id,
  });
  await newPending.save();

  const pendingCode = new PendingModel({
    inviteCode: inviteCode,
    workspaceId: workspace._id,
  });
  await pendingCode.save();
};

export const getPendingMemberRoleInWorkspace = async (inviteCode: string) => {
  const find = await PendingModel.findOne({ inviteCode }).lean();
  if (!find) throw new NotFoundException("Invalid invite code or workspace not found");

  const result = await PendingMemberModel.findOne({
    workspaceId: find.workspaceId,
  }).lean();
  if (!result) throw new NotFoundException("Invalid invite code or workspace not found");

  return { status: result.status, workspaceId: result.workspaceId };
};
