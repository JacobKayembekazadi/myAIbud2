"use client";

import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <main
            className={cn(
                "flex-1 transition-all duration-300 ease-in-out min-h-screen",
                isCollapsed ? "ml-[72px]" : "ml-64"
            )}
        >
            {children}
        </main>
    );
}
