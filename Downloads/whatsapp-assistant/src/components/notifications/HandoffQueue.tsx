"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Clock, MessageSquare, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { Id } from "@/../convex/_generated/dataModel";
import Link from "next/link";

interface HandoffQueueProps {
  tenantId: Id<"tenants">;
}

export function HandoffQueue({ tenantId }: HandoffQueueProps) {
  const handoffQueue = useQuery(api.notifications.getHandoffQueue, { tenantId });
  const resolveHandoff = useMutation(api.notifications.resolveHandoff);

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m waiting`;
    return `${hours}h waiting`;
  };

  const handleResolve = async (contactId: Id<"contacts">, resumeAI: boolean) => {
    await resolveHandoff({
      contactId,
      resumeAI,
    });
  };

  if (!handoffQueue) {
    return (
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            Handoff Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-800 rounded-lg" />
            <div className="h-16 bg-gray-800 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              Handoff Queue
              {handoffQueue.length > 0 && (
                <Badge className="bg-amber-600/20 text-amber-400 border-0">
                  {handoffQueue.length}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              Customers waiting for human assistance
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {handoffQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mb-3 text-emerald-600/50" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-gray-600 mt-1">No customers waiting for assistance</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-3">
              {handoffQueue.map((contact) => (
                <div
                  key={contact._id}
                  className="p-4 rounded-lg border border-amber-800/50 bg-amber-950/20 hover:bg-amber-950/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white truncate">
                          {contact.name || contact.phone}
                        </p>
                        {contact.detectedLanguage && contact.detectedLanguage !== "en" && (
                          <Badge className="bg-blue-600/20 text-blue-400 border-0 text-xs">
                            {contact.detectedLanguage.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      {contact.name && (
                        <p className="text-gray-500 text-xs mt-0.5">{contact.phone}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-amber-400 text-xs">
                          <Clock className="w-3 h-3" />
                          {formatTime(contact.handoffAt)}
                        </span>
                        {contact.leadGrade && (
                          <Badge
                            className={`text-xs border-0 ${
                              contact.leadGrade === "A"
                                ? "bg-emerald-600/20 text-emerald-400"
                                : contact.leadGrade === "B"
                                ? "bg-blue-600/20 text-blue-400"
                                : "bg-gray-600/20 text-gray-400"
                            }`}
                          >
                            Grade {contact.leadGrade}
                          </Badge>
                        )}
                      </div>
                      {contact.handoffReason && (
                        <p className="text-gray-400 text-xs mt-2 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{contact.handoffReason}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/chat/${contact._id}`}>
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Reply
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolve(contact._id, true)}
                        className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 w-full"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
