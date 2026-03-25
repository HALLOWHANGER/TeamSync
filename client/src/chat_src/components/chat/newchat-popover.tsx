import { memo, useState } from "react";
import { useChat } from "@/chat_src/hooks/use-chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ArrowLeft, PenBoxIcon, Search, UsersIcon } from "lucide-react";
import { Spinner } from "../ui/spinner";
import type { UserType } from "@/chat_src/types/auth.type";
import AvatarWithBadge from "../avatar-with-badge";
import { Checkbox } from "../ui/checkbox";
import { useNavigate, useParams } from "react-router-dom";

export const NewChatPopover = memo(() => {
  const navigate = useNavigate();
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { fetchAllUsers, users, isUsersLoading, createChat, isCreatingChat } = useChat();

  const [isOpen, setIsOpen] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const resetState = () => {
    setIsGroupMode(false);
    setGroupName("");
    setSelectedUsers([]);
    setSearch("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (workspaceId) fetchAllUsers(workspaceId);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetState();
  };

  const filteredUsers = (users ?? []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleUserSelection = (id: string) =>
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || !workspaceId) return;
    const response = await createChat({
      workspaceId,
      isGroup: true,
      participants: selectedUsers,
      groupName,
    });
    handleClose();
    if (response?._id) navigate(`/workspace/${workspaceId}/chats/${response._id}`);
  };

  const handleCreateChat = async (userId: string) => {
    if (!workspaceId) return;
    setLoadingUserId(userId);
    try {
      const response = await createChat({
        workspaceId,
        isGroup: false,
        participantId: userId,
      });
      if (response?._id) navigate(`/workspace/${workspaceId}/chats/${response._id}`);
    } finally {
      setLoadingUserId(null);
      handleClose();
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleOpen}
      >
        <PenBoxIcon className="!h-5 !w-5 !stroke-1" />
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="p-0 gap-0 w-80 max-w-[90vw] rounded-xl overflow-hidden">
          <DialogHeader className="border-b border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              {isGroupMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => setIsGroupMode(false)}
                >
                  <ArrowLeft size={15} />
                </Button>
              )}
              <DialogTitle className="text-base">
                {isGroupMode ? "New Group" : "New Chat"}
              </DialogTitle>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border/50">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={isGroupMode ? groupName : search}
                onChange={(e) =>
                  isGroupMode
                    ? setGroupName(e.target.value)
                    : setSearch(e.target.value)
                }
                placeholder={isGroupMode ? "Group name…" : "Search members…"}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          </DialogHeader>

          {/* User list */}
          <div className="overflow-y-auto px-1 py-1 space-y-0.5" style={{ maxHeight: 360 }}>
            {isUsersLoading ? (
              <div className="flex justify-center py-8">
                <Spinner className="w-6 h-6" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8 px-4">
                No other workspace members found
              </div>
            ) : !isGroupMode ? (
              <>
                <NewGroupItem
                  disabled={isCreatingChat}
                  onClick={() => setIsGroupMode(true)}
                />
                {filteredUsers.map((user) => (
                  <ChatUserItem
                    key={user._id}
                    user={user}
                    isLoading={loadingUserId === user._id}
                    disabled={loadingUserId !== null}
                    onClick={handleCreateChat}
                  />
                ))}
              </>
            ) : (
              filteredUsers.map((user) => (
                <GroupUserItem
                  key={user._id}
                  user={user}
                  isSelected={selectedUsers.includes(user._id)}
                  onToggle={toggleUserSelection}
                />
              ))
            )}
          </div>

          {/* Group create footer */}
          {isGroupMode && (
            <div className="border-t border-border p-3">
              <Button
                onClick={handleCreateGroup}
                className="w-full"
                disabled={
                  isCreatingChat || !groupName.trim() || selectedUsers.length === 0
                }
              >
                {isCreatingChat && <Spinner className="w-4 h-4 mr-2" />}
                Create Group ({selectedUsers.length})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});
NewChatPopover.displayName = "NewChatPopover";

// ─── Sub-components ───────────────────────────────────────────────────────────

const UserAvatar = memo(({ user }: { user: UserType }) => (
  <>
    <AvatarWithBadge name={user.name} src={user.avatar ?? ""} />
    <div className="flex-1 min-w-0">
      <h5 className="text-[13px] font-medium truncate">{user.name}</h5>
      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
    </div>
  </>
));
UserAvatar.displayName = "UserAvatar";

const NewGroupItem = memo(
  ({ disabled, onClick }: { disabled: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
    >
      <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
        <UsersIcon className="size-4 text-primary" />
      </div>
      <div>
        <span className="text-sm font-medium">New Group</span>
        <p className="text-[11px] text-muted-foreground">
          Create a group with workspace members
        </p>
      </div>
    </button>
  )
);
NewGroupItem.displayName = "NewGroupItem";

const ChatUserItem = memo(
  ({
    user,
    isLoading,
    disabled,
    onClick,
  }: {
    user: UserType;
    disabled: boolean;
    isLoading: boolean;
    onClick: (id: string) => void;
  }) => (
    <button
      className="relative w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors text-left disabled:opacity-50"
      disabled={isLoading || disabled}
      onClick={() => onClick(user._id)}
    >
      <UserAvatar user={user} />
      {isLoading && <Spinner className="absolute right-2 w-4 h-4" />}
    </button>
  )
);
ChatUserItem.displayName = "ChatUserItem";

const GroupUserItem = memo(
  ({
    user,
    isSelected,
    onToggle,
  }: {
    user: UserType;
    isSelected: boolean;
    onToggle: (id: string) => void;
  }) => (
    <div
      role="button"
      className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
      onClick={() => onToggle(user._id)}
    >
      <UserAvatar user={user} />
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onToggle(user._id)}
        className="flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
);
GroupUserItem.displayName = "GroupUserItem";
