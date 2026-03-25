import { Separator } from "@/components/ui/separator";
import InviteMember from "@/components/workspace/member/invite-member";
import AllMembers from "@/components/workspace/member/all-members";
import PendingMember from "@/components/workspace/member/pending-members";
import WorkspaceHeader from "@/components/workspace/common/workspace-header";

import PermissionsGuard from "@/components/resuable/permission-guard";
import { Permissions } from "@/constant";



export default function Members() {
  return (
    <div className="w-full h-auto pt-2">
      <WorkspaceHeader />
      <Separator className="my-4 " />
      <main>
        <div className="w-full max-w-3xl mx-auto pt-3">
          <div>
            <h2 className="text-lg leading-[30px] font-semibold mb-1">
              Workspace members
            </h2>
            <p className="text-sm text-muted-foreground">
              Workspace members can view and join all Workspace project, tasks
              and create new task in the Workspace.
            </p>
          </div>
          <Separator className="my-4" />

          <InviteMember />
          <Separator className="my-4 !h-[0.5px]" />

          <AllMembers />

      <PermissionsGuard showMessage requiredPermission={Permissions.ADD_MEMBER}>

          {}
          <Separator className="my-4 !h-[0.5px]" />
            <h3 className="text-lg leading-[30px] font-semibold mb-1">
              Pending members
            </h3>

            <PendingMember />

          </PermissionsGuard>
        </div>
      </main>
    </div>
  );
}
