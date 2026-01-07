"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Home, MessageSquare, Smartphone, Upload } from "lucide-react";

const navItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/instances", label: "Instances", icon: Smartphone },
    { href: "/campaigns", label: "Campaigns", icon: Upload },
    { href: "/chat", label: "Chats", icon: MessageSquare },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                    My Aibud
                </h1>
                <p className="text-xs text-gray-500 mt-1">WhatsApp AI Assistant</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? "bg-green-600/20 text-green-400 border border-green-600/30"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-3 px-2">
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "w-10 h-10"
                            }
                        }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">Account</p>
                        <p className="text-xs text-gray-500">Manage settings</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
