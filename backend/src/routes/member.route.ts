import { Router } from "express";
import { joinWorkspaceController, addPendingMemberController, getStatusController, DeclinePendingMemberController } from "../controllers/member.controller";

const memberRoutes = Router();

memberRoutes.post("/workspace/:inviteCode/join", joinWorkspaceController);

memberRoutes.post("/workspace/:inviteCode/pending", addPendingMemberController);

memberRoutes.post("/workspace/:inviteCode/reject", DeclinePendingMemberController);

memberRoutes.get("/workspace/:inviteCode/invite-status", getStatusController);


export default memberRoutes;
