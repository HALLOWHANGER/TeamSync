import { Router } from "express";
import { getCurrentUserController } from "../controllers/user.controller";
import { getAllUsersController } from "../controllers/chat.controller";

const userRoutes = Router();

userRoutes.get("/current", getCurrentUserController);
// ?workspaceId=xxx returns only workspace members
userRoutes.get("/all", getAllUsersController);

export default userRoutes;
