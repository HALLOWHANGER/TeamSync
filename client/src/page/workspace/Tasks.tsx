import CreateTaskDialog from "@/components/workspace/task/create-task-dialog";
import TaskTable from "@/components/workspace/task/task-table";
import { useAuthContext } from "@/context/auth-provider";
import { UserPermissionsInWorkspaceQueryFn } from "@/lib/api";
import useWorkspaceId from "@/hooks/use-workspace-id";
import { useEffect, useState } from "react";

export default function Tasks() {
  const { user } = useAuthContext();
  const workspaceId = useWorkspaceId();
  const [role, setRole] = useState<string | null>(null);

useEffect(() => {
  const fetchRole = async () => {
    const data = await UserPermissionsInWorkspaceQueryFn({
      workspaceId,
      userId: user?.email || ""
    });

    setRole(data.role);
  };

  fetchRole();
}, [workspaceId, user?.email]);

  return (
    <div className="w-full h-full flex-col space-y-8 pt-3">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Tasks</h2>
          <p className="text-muted-foreground">
            Here&apos;s the list of tasks for this workspace!
          </p>
        </div>
        {role === "OWNER" && <CreateTaskDialog />}
      </div>
      {/* {Task Table} */}
      <div>
        <TaskTable />
      </div>
    </div>
  );
}
