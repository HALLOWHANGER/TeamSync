import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { z } from "zod";
import { HTTPSTATUS } from "../config/http.config";
import { joinWorkspaceByInviteService, joinWorkspacePendingService, getPendingMemberRoleInWorkspace, DeclineWorkspaceByInviteService } from "../services/member.service";
import { stat } from "fs";

export const joinWorkspaceController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = z.string().parse(req.params.inviteCode);

    const { workspaceId, role } = await joinWorkspaceByInviteService(
      id,
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace",
      workspaceId,
      role,
    });
  }
);

export const addPendingMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const userId = req.user?._id;

    await joinWorkspacePendingService(
      userId,
      inviteCode
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace"
    });
  }
);

export const DeclinePendingMemberController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = z.string().parse(req.params.inviteCode);


    await DeclineWorkspaceByInviteService(
      id,

    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace"
    });
  }
);


export const getStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    const inviteCode = z.string().parse(req.params.inviteCode);
    const userId = req.user?._id;

    const { status, workspaceId } = await getPendingMemberRoleInWorkspace(
      inviteCode
    );

    return res.status(HTTPSTATUS.OK).json({
      message: "Successfully joined the workspace",
      status,
      workspaceId
    });
  }
);
