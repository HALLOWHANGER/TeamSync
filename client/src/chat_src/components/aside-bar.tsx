import { useSocket } from "@/chat_src/hooks/use-socket";
import { useTheme } from "./theme-provider";
import { isUserOnline } from "@/chat_src/lib/helper";
import Logo from "./logo";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import AvatarWithBadge from "./avatar-with-badge";
import { useAuthContext } from "@/context/auth-provider";
import { useNavigate, useParams } from "react-router-dom";

const AsideBar = () => {
  const { user } = useAuthContext();
  const { theme, setTheme } = useTheme();
  const { disconnectSocket } = useSocket();
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const isOnline = isUserOnline(user?._id);

  const handleLogout = () => {
    disconnectSocket();
    // Redirect to main app logout/login
    navigate("/sign-in");
  };

  return (
    <aside className="top-0 fixed inset-y-0 w-11 left-0 z-[9999] h-svh bg-primary/85 shadow-sm">
      <div className="w-full h-full px-1 pt-1 pb-6 flex flex-col items-center justify-between">
        <Logo
          url={workspaceId ? `/workspace/${workspaceId}/chats` : "/"}
          imgClass="size-7"
          textClass="text-white"
          showText={false}
        />

        <div className="flex flex-col items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="border-0 rounded-full"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:-rotate-0" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div role="button">
                <AvatarWithBadge
                  name={user?.name || "Unknown"}
                  src={(user as any)?.profilePicture || ""}
                  isOnline={isOnline}
                  className="!bg-white"
                />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-lg z-[99999]" align="end">
              <DropdownMenuLabel>{user?.name || "My Account"}</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
};

export default AsideBar;
