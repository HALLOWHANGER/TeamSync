import { Loader } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { BASE_ROUTE } from "@/routes/common/routePaths";
import useAuth from "@/hooks/api/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { JoinWorkspaceMutationFn, CheckInviteStatusFn } from "@/lib/api"; // 👈 you'll create this
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

const InviteUser = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const param = useParams();
  const inviteCode = param.inviteCode as string;

  const { data: authData, isPending } = useAuth();
  const user = authData?.user;

  const [waiting, setWaiting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: JoinWorkspaceMutationFn,
  });

  const returnUrl = encodeURIComponent(
    `${BASE_ROUTE.INVITE_URL.replace(":inviteCode", inviteCode)}`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate(inviteCode, {
      onSuccess: () => {
        setWaiting(true);
        setStatusMessage("Invite sent. Awaiting access...");
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  // 🔥 Polling logic
  useEffect(() => {
    
    if (!waiting) return;

    const interval = setInterval(async () => {
      try {
        const response = await CheckInviteStatusFn(inviteCode);
        // expected response: { status: "PENDING" | "APPROVED" | "DENIED", workspaceId?: string }
        console.log("response", response);

        if (response.status === "APPROVED") {
          clearInterval(interval);
          queryClient.resetQueries({ queryKey: ["userWorkspaces"] });
          navigate(`/workspace/${response.workspaceId}`);
        }

        if (response.status === "DENIED") {
          clearInterval(interval);
          setStatusMessage("Request denied.");

          setTimeout(() => {
            navigate("/sign-up");
          }, 3000);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [waiting, inviteCode, navigate, queryClient]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <Logo />
          Team Sync.
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              Hey there! You're invited to join a TeamSync Workspace!
            </CardTitle>
            <CardDescription>
              Looks like you need to be logged in to join this Workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isPending ? (
              <Loader className="!w-11 !h-11 animate-spin place-self-center flex" />
            ) : waiting ? (
              <div className="flex flex-col items-center gap-4">
                <Loader className="!w-8 !h-8 animate-spin" />
                <p className="text-center text-lg font-medium">
                  {statusMessage}
                </p>
              </div>
            ) : user ? (
              <div className="flex items-center justify-center my-3">
                <form onSubmit={handleSubmit}>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="!bg-green-500 !text-white text-[23px] !h-auto"
                  >
                    {isLoading && (
                      <Loader className="!w-6 !h-6 animate-spin" />
                    )}
                    Join the Workspace
                  </Button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-2">
                <Link
                  className="flex-1 w-full text-base"
                  to={`/sign-up?returnUrl=${returnUrl}`}
                >
                  <Button className="w-full">Signup</Button>
                </Link>
                <Link
                  className="flex-1 w-full text-base"
                  to={`/sign-in?returnUrl=${returnUrl}`}
                >
                  <Button variant="secondary" className="w-full border">
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InviteUser;