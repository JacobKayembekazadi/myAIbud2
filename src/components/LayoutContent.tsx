"use client";

import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { NotificationBell } from "./notifications/NotificationBell";

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();
    const { userId } = useAuth();
    const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");

    return (
        <main
            className={cn(
                "flex-1 transition-all duration-300 ease-in-out min-h-screen flex flex-col",
                isCollapsed ? "ml-[72px]" : "ml-64"
            )}
        >
            {/* Top Header Bar with Notifications */}
            <header className="h-14 border-b border-gray-800/40 bg-[#02040a]/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-end px-6">
                {tenant && <NotificationBell tenantId={tenant._id} />}
            </header>

            {/* Main Content */}
            <div className="flex-1">
                {children}
            </div>
        </main>
    );
}
