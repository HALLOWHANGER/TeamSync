import GoogleOAuthFailure from "@/page/auth/GoogleOAuthFailure";
import SignIn from "@/page/auth/Sign-in";
import SignUp from "@/page/auth/Sign-up";
import Landing from "@/page/auth/App";
import WorkspaceDashboard from "@/page/workspace/Dashboard";
import Members from "@/page/workspace/Members";
import ProjectDetails from "@/page/workspace/ProjectDetails";
import Settings from "@/page/workspace/Settings";
import Chats from "@/page/chat/index";
import ChatsId from "@/page/chat/chatId/index";
import Tasks from "@/page/workspace/Tasks";
import { AUTH_ROUTES, BASE_ROUTE, PROTECTED_ROUTES } from "./routePaths";
import InviteUser from "@/page/invite/InviteUser";

export const authenticationRoutePaths = [
  { path: AUTH_ROUTES.SIGN_IN, element: <SignIn /> },
  { path: AUTH_ROUTES.SIGN_UP, element: <SignUp /> },
  { path: AUTH_ROUTES.GOOGLE_OAUTH_CALLBACK, element: <GoogleOAuthFailure /> },
];

export const protectedRoutePaths = [
  { path: PROTECTED_ROUTES.WORKSPACE, element: <WorkspaceDashboard /> },
  { path: PROTECTED_ROUTES.TASKS, element: <Tasks /> },
  { path: PROTECTED_ROUTES.MEMBERS, element: <Members /> },
  { path: PROTECTED_ROUTES.SETTINGS, element: <Settings /> },
  { path: PROTECTED_ROUTES.PROJECT_DETAILS, element: <ProjectDetails /> },
];

// Chat routes use their own full-screen ChatLayout (no workspace header/padding)
export const chatRoutePaths = [
  { path: PROTECTED_ROUTES.CHATS, element: <Chats /> },
  { path: PROTECTED_ROUTES.SINGLE_CHAT, element: <ChatsId /> },
];

export const baseRoutePaths = [
  { path: BASE_ROUTE.INVITE_URL, element: <InviteUser /> },
];

export const commonRoutePaths = [
  { path: BASE_ROUTE.HOME, element: <Landing /> },
];
