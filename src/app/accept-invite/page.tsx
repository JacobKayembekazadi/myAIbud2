"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Users } from "lucide-react";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const acceptInvite = useMutation(api.teamMembers.acceptInvite);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Redirect to sign in, then back here
      const returnUrl = `/accept-invite?token=${token}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!token) {
      setStatus("error");
      setErrorMessage("No invitation token provided");
      return;
    }

    // Accept the invitation
    handleAcceptInvite();
  }, [isLoaded, isSignedIn, token]);

  const handleAcceptInvite = async () => {
    if (!token) return;

    try {
      const result = await acceptInvite({ inviteToken: token });
      setOrganizationId(result.organizationId);
      setStatus("success");

      // Redirect to team page after 2 seconds
      setTimeout(() => {
        router.push("/team");
      }, 2000);
    } catch (error) {
      console.error("Failed to accept invite:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to accept invitation");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="bg-gray-900 border-gray-800 max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {status === "loading" && (
              <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
            )}
            {status === "error" && (
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            )}
          </div>

          <CardTitle className="text-white text-center">
            {status === "loading" && "Accepting Invitation..."}
            {status === "success" && "Welcome to the Team!"}
            {status === "error" && "Invitation Error"}
          </CardTitle>

          <CardDescription className="text-center">
            {status === "loading" && "Please wait while we process your invitation"}
            {status === "success" && "You've successfully joined the organization"}
            {status === "error" && "There was a problem with your invitation"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {status === "loading" && (
            <div className="text-center text-gray-400">
              <p>Processing your invitation...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="bg-emerald-600/10 border border-emerald-600/30 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <p className="text-emerald-400 text-sm">
                  Redirecting you to the team page...
                </p>
              </div>
              <Button
                onClick={() => router.push("/team")}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Go to Team Page
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
                <p className="text-red-400 text-sm text-center">{errorMessage}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Go Home
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
