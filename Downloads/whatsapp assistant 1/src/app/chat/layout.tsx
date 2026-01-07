"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const contacts = useQuery(
    api.contacts.listContacts,
    tenant ? { tenantId: tenant._id } : "skip"
  );

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Contacts</h2>
          <Link href="/instances" className="text-sm text-green-500 hover:text-green-400">
            Manage Instances
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts?.map((contact) => (
            <Link
              key={contact._id}
              href={`/chat/${contact._id}`}
              className="block p-3 border-b border-gray-800 hover:bg-gray-900"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">{contact.name ?? contact.phone}</span>
                <span className="text-xs text-gray-500">{formatDate(contact.lastInteraction)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm text-gray-400 truncate">{contact.phone}</span>
                {contact.status === "paused" && (
                  <span className="px-2 py-0.5 bg-yellow-900 text-yellow-400 text-xs rounded">Paused</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </aside>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
