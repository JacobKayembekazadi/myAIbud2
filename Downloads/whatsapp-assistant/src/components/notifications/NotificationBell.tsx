"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, User, Calendar, MessageSquare, AlertTriangle, Check, CheckCheck } from "lucide-react";
import { Id } from "@/../convex/_generated/dataModel";
import Link from "next/link";

interface NotificationBellProps {
  tenantId: Id<"tenants">;
}

export function NotificationBell({ tenantId }: NotificationBellProps) {
  const [open, setOpen] = useState(false);

  const notifications = useQuery(api.notifications.listNotifications, {
    tenantId,
    limit: 20,
  });

  const unreadCount = useQuery(api.notifications.getUnreadCount, { tenantId });

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const getIcon = (type: string) => {
    switch (type) {
      case "handoff_request":
        return <User className="w-4 h-4 text-amber-400" />;
      case "new_lead":
        return <AlertTriangle className="w-4 h-4 text-emerald-400" />;
      case "appointment_booked":
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case "follow_up_due":
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-red-500 bg-red-950/50";
      case "high":
        return "border-amber-500 bg-amber-950/50";
      case "medium":
        return "border-blue-500 bg-blue-950/50";
      default:
        return "border-gray-700 bg-gray-900/50";
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleNotificationClick = async (notificationId: Id<"notifications">, actionUrl?: string) => {
    await markAsRead({ notificationId });
    if (actionUrl) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Bell className="w-5 h-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs bg-red-500 hover:bg-red-500 border-0">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 bg-gray-900 border-gray-700"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead({ tenantId })}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-10 h-10 mb-3 text-gray-700" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification) => (
                <Link
                  key={notification._id}
                  href={notification.actionUrl || "#"}
                  onClick={() => handleNotificationClick(notification._id, notification.actionUrl)}
                >
                  <div
                    className={`p-4 hover:bg-gray-800/50 cursor-pointer transition-colors ${
                      !notification.isRead ? "bg-gray-800/30" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white text-sm truncate">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
