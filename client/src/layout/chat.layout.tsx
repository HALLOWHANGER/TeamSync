import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider, useAuthContext } from "@/context/auth-provider";
import Asidebar from "@/components/asidebar/asidebar";
import ChatList from "@/chat_src/components/chat/chat-list";
import { useSocket } from "@/chat_src/hooks/use-socket";

const SocketConnector = () => {
  const { user } = useAuthContext();
  const { connectSocket } = useSocket();
  useEffect(() => {
    if (user?._id) connectSocket(user._id);
  }, [user?._id, connectSocket]);
  return null;
};

const ChatLayout = () => {
  return (
    <AuthProvider>
      <SidebarProvider>
        <SocketConnector />
        <Asidebar />
        {/* 
          Do NOT put overflow-hidden here — it creates a stacking context that
          clips Radix portals (Popover, Dialog, DropdownMenu etc.)
        */}
        <SidebarInset className="p-0">
          <div className="flex h-svh">
            <ChatList />
            <div className="flex-1 min-w-0 overflow-hidden">
              <Outlet />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default ChatLayout;
