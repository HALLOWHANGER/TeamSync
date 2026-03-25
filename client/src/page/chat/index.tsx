import EmptyState from "@/chat_src/components/empty-state";

/**
 * Shown in the main content area when no chat is selected (desktop only).
 * The ChatList sidebar is always visible via ChatLayout.
 */
const Chat = () => {
  return (
    <div className="hidden lg:flex h-full items-center justify-center bg-background">
      <EmptyState
        title="No chat selected"
        description="Pick a chat from the list or start a new one"
      />
    </div>
  );
};

export default Chat;
