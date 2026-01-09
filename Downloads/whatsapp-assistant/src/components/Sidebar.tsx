"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Home, MessageSquare, Smartphone, Upload, Bot, ChevronLeft, ChevronRight, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/instances", label: "Instances", icon: Smartphone },
    { href: "/campaigns", label: "Campaigns", icon: Upload },
    { href: "/chat", label: "Chats", icon: MessageSquare },
    { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed, toggleCollapse } = useSidebar();

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen bg-[#02040a] border-r border-gray-800/40 flex flex-col z-50 transition-all duration-300 ease-in-out select-none shadow-2xl",
                isCollapsed ? "w-[72px]" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className={cn(
                "h-20 flex items-center border-b border-gray-800/40 px-4",
                isCollapsed ? "justify-center" : "justify-start gap-3"
            )}>
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] group cursor-pointer transition-transform hover:scale-105 active:scale-95 text-white">
                    <Bot className="w-6 h-6" />
                </div>

                {!isCollapsed && (
                    <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-white font-bold tracking-tight text-lg leading-none">MyChatFlow</span>
                        <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest mt-1 opacity-80">WhatsApp Automation</span>
                    </div>
                )}
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-hidden hover:overflow-y-auto custom-scrollbar transition-all">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-xl py-2.5 transition-all duration-200 group relative",
                                isCollapsed ? "justify-center px-0" : "px-3 gap-3",
                                isActive
                                    ? "bg-green-500/10 text-green-400 shadow-[inset_0_0_12px_rgba(34,197,94,0.05)]"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {/* Active Indicator Pillar */}
                            {isActive && (
                                <div className={cn(
                                    "absolute bg-green-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(34,197,94,0.8)]",
                                    isCollapsed ? "left-0 w-1 h-6" : "left-0 w-1 h-6"
                                )} />
                            )}

                            <Icon className={cn(
                                "flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                                isCollapsed ? "w-6 h-6" : "w-5 h-5",
                                isActive ? "text-green-400" : "text-gray-500 group-hover:text-gray-300"
                            )} />

                            {!isCollapsed && (
                                <span className="font-semibold text-sm tracking-wide">
                                    {item.label}
                                </span>
                            )}

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 border border-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[100] shadow-xl">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Section */}
            <div className="mt-auto flex flex-col items-center">
                {/* Simplified Toggle Button */}
                <div className="w-full px-3 py-4 flex justify-center">
                    <button
                        onClick={toggleCollapse}
                        className="flex items-center justify-center w-full h-10 rounded-xl bg-gray-900/50 hover:bg-gray-800/80 text-gray-400 hover:text-white border border-gray-800/30 transition-all duration-200"
                    >
                        {isCollapsed ? (
                            <ChevronRight className="w-5 h-5" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <ChevronLeft className="w-4 h-4" />
                                <span className="text-[11px] font-bold uppercase tracking-widest">Collapse Menu</span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Profile Section */}
                <div className={cn(
                    "w-full border-t border-gray-800/40 p-3 bg-gradient-to-t from-black to-transparent",
                    isCollapsed ? "flex justify-center" : "flex items-center gap-3"
                )}>
                    <div className="relative group">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 border border-gray-700 group-hover:border-green-500/50 transition-colors shadow-lg",
                                    userButtonPopoverCard: "bg-gray-950 border border-gray-800",
                                }
                            }}
                        />
                        {isCollapsed && (
                            <div className="absolute right-0 bottom-0 w-2.5 h-2.5 bg-green-500 border-2 border-black rounded-full shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                        )}
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col min-w-0 flex-1 animate-in fade-in slide-in-from-left-2 duration-300">
                            <span className="text-sm font-bold text-gray-200 truncate leading-none">Settings & Profile</span>
                            <span className="text-[10px] text-green-500 font-bold tracking-tight mt-1">PRO ACCOUNT ACTIVE</span>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
