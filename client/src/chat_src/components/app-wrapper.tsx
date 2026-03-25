import React, { useEffect } from "react";
import AsideBar from "./aside-bar";
import { useSocket } from "@/chat_src/hooks/use-socket";
import { useAuthContext } from "@/context/auth-provider";

interface Props {
  children: React.ReactNode;
}

/**
 * Connects the socket on mount and renders the narrow icon sidebar.
 * The children are rendered as-is; layout is controlled by ChatLayout.
 */
const AppWrapper = ({ children }: Props) => {
  const { user } = useAuthContext();
  const { connectSocket } = useSocket();

  useEffect(() => {
    if (user?._id) connectSocket(user._id);
  }, [user?._id, connectSocket]);

  return (
    <>
      <AsideBar />
      {children}
    </>
  );
};

export default AppWrapper;
