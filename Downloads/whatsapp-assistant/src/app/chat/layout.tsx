"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Users, Filter, X } from "lucide-react";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const contacts = useQuery(
    api.contacts.listContacts,
    tenant ? { tenantId: tenant._id } : "skip"
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "new">("all");

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    
    return contacts.filter((contact) => {
      // Filter out demo contacts from main view
      if (contact.isDemo) return false;
      
      const matchesSearch = 
        searchQuery === "" ||
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery);
      
      const matchesStatus = 
        statusFilter === "all" || contact.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [contacts, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    if (!contacts) return { all: 0, active: 0, paused: 0, new: 0 };
    
    const nonDemo = contacts.filter(c => !c.isDemo);
    return {
      all: nonDemo.length,
      active: nonDemo.filter(c => c.status === "active").length,
      paused: nonDemo.filter(c => c.status === "paused").length,
      new: nonDemo.filter(c => c.status === "new").length,
    };
  }, [contacts]);

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-600/20 text-emerald-400 border-0 text-[10px]">Active</Badge>;
      case "paused":
        return <Badge className="bg-amber-600/20 text-amber-400 border-0 text-[10px]">Paused</Badge>;
      case "new":
        return <Badge className="bg-blue-600/20 text-blue-400 border-0 text-[10px]">New</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400 border-0 text-[10px]">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950">
      <aside className="w-80 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Contacts
            </h2>
            <Link href="/contacts">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-8 px-2">
                <Filter className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="px-2 py-2 border-b border-gray-800">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList className="w-full bg-gray-900/50 h-8">
              <TabsTrigger value="all" className="flex-1 text-xs data-[state=active]:bg-gray-800">
                All ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="active" className="flex-1 text-xs data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">
                Active ({statusCounts.active})
              </TabsTrigger>
              <TabsTrigger value="paused" className="flex-1 text-xs data-[state=active]:bg-amber-600/20 data-[state=active]:text-amber-400">
                Paused ({statusCounts.paused})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {searchQuery ? "No contacts match your search" : "No contacts yet"}
              </p>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-emerald-500 hover:text-emerald-400"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <Link
                key={contact._id}
                href={`/chat/${contact._id}`}
                className="block p-3 border-b border-gray-800/50 hover:bg-gray-900/70 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white truncate">
                        {contact.name ?? contact.phone}
                      </span>
                      {getStatusBadge(contact.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500 truncate">{contact.phone}</span>
                    </div>
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {contact.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-gray-700 text-gray-400"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="text-[10px] text-gray-500">+{contact.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 shrink-0">
                    {formatDate(contact.lastInteraction)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 bg-gray-900/30">
          <Link href="/contacts" className="block">
            <Button variant="outline" size="sm" className="w-full border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800">
              Manage All Contacts
            </Button>
          </Link>
        </div>
      </aside>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
