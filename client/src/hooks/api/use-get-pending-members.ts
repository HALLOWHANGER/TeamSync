import {  getPendingMembersInWorkspaceQueryFn } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

 const useGetPendingWorkspaceMembers = (workspaceId: string) => {
  const query = useQuery({
    queryKey: ["PendingMember", workspaceId],
    queryFn: () => getPendingMembersInWorkspaceQueryFn(workspaceId),
    staleTime: Infinity,
  });
  return query;
};

export default useGetPendingWorkspaceMembers;

