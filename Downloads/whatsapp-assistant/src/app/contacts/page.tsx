"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Id } from "@/../convex/_generated/dataModel";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Users,
  Download,
  Upload,
  Trash2,
  Pause,
  Play,
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  Edit,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ContactDetailsDialog } from "@/components/contacts/ContactDetailsDialog";
import { ImportContactsDialog } from "@/components/contacts/ImportContactsDialog";
import { ExportContactsButton } from "@/components/contacts/ExportContactsButton";

export default function ContactsPage() {
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const instances = useQuery(
    api.instances.listInstances,
    tenant ? { tenantId: tenant._id } : "skip"
  );
  const settings = useQuery(
    api.settings.getSettings,
    tenant ? { tenantId: tenant._id } : "skip"
  );

  // Determine which instance to show contacts for
  const activeInstanceId = settings?.defaultInstanceId || instances?.[0]?.instanceId;

  const contacts = useQuery(
    api.contacts.listContacts,
    tenant && activeInstanceId
      ? { tenantId: tenant._id, instanceId: activeInstanceId }
      : "skip"
  );

  const bulkPause = useMutation(api.contacts.bulkPauseContacts);
  const bulkResume = useMutation(api.contacts.bulkResumeContacts);
  const bulkDelete = useMutation(api.contacts.bulkDeleteContacts);
  const deleteContact = useMutation(api.contacts.deleteContact);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selectedContacts, setSelectedContacts] = useState<Set<Id<"contacts">>>(new Set());
  const [editingContact, setEditingContact] = useState<Id<"contacts"> | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Id<"contacts"> | null>(null);

  // Get all unique tags from contacts
  const allTags = useMemo(() => {
    if (!contacts) return [];
    const tags = new Set<string>();
    contacts.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [contacts]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    
    return contacts.filter((contact) => {
      if (contact.isDemo) return false;
      
      const matchesSearch = 
        searchQuery === "" ||
        contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery) ||
        contact.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === "all" || contact.status === statusFilter;
      
      const matchesTag =
        tagFilter === "all" || contact.tags?.includes(tagFilter);
      
      return matchesSearch && matchesStatus && matchesTag;
    });
  }, [contacts, searchQuery, statusFilter, tagFilter]);

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c._id)));
    }
  };

  const toggleSelect = (id: Id<"contacts">) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedContacts(newSet);
  };

  const handleBulkPause = async () => {
    await bulkPause({ contactIds: Array.from(selectedContacts) });
    setSelectedContacts(new Set());
  };

  const handleBulkResume = async () => {
    await bulkResume({ contactIds: Array.from(selectedContacts) });
    setSelectedContacts(new Set());
  };

  const handleBulkDelete = async () => {
    await bulkDelete({ contactIds: Array.from(selectedContacts) });
    setSelectedContacts(new Set());
    setDeleteDialogOpen(false);
  };

  const handleDeleteSingle = async () => {
    if (contactToDelete) {
      await deleteContact({ contactId: contactToDelete });
      setContactToDelete(null);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-600/20 text-emerald-400 border-0">Active</Badge>;
      case "paused":
        return <Badge className="bg-amber-600/20 text-amber-400 border-0">Paused</Badge>;
      case "new":
        return <Badge className="bg-blue-600/20 text-blue-400 border-0">New</Badge>;
      default:
        return <Badge className="bg-gray-600/20 text-gray-400 border-0">{status}</Badge>;
    }
  };

  if (tenant === undefined || contacts === undefined || instances === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6 bg-gray-800" />
          <Skeleton className="h-96 w-full bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-500" />
                Contacts
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {contacts.filter(c => !c.isDemo).length} total contacts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <ExportContactsButton contacts={contacts?.filter(c => !c.isDemo)} />
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gray-900/50 border-gray-800 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search by name, phone, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-40 bg-gray-900 border-gray-700 text-white">
                  <Tag className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Action Toolbar */}
        {selectedContacts.size > 0 && (
          <Card className="bg-emerald-950/30 border-emerald-800/50 mb-4">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-medium">
                  {selectedContacts.size} contact{selectedContacts.size > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkPause}
                    className="border-amber-700 text-amber-400 hover:bg-amber-950"
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkResume}
                    className="border-emerald-700 text-emerald-400 hover:bg-emerald-950"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="border-red-700 text-red-400 hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacts Table */}
        <Card className="bg-gray-900/50 border-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                    onCheckedChange={toggleSelectAll}
                    className="border-gray-600"
                  />
                </TableHead>
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Phone</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Tags</TableHead>
                <TableHead className="text-gray-400">Last Active</TableHead>
                <TableHead className="text-gray-400 w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500">No contacts found</p>
                    {(searchQuery || statusFilter !== "all" || tagFilter !== "all") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setTagFilter("all");
                        }}
                        className="mt-2 text-emerald-500"
                      >
                        Clear filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow
                    key={contact._id}
                    className="border-gray-800 hover:bg-gray-800/50"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedContacts.has(contact._id)}
                        onCheckedChange={() => toggleSelect(contact._id)}
                        className="border-gray-600"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {contact.name || <span className="text-gray-500">Unknown</span>}
                    </TableCell>
                    <TableCell className="text-gray-400">{contact.phone}</TableCell>
                    <TableCell>{getStatusBadge(contact.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs border-gray-700 text-gray-400"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {contact.tags && contact.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{contact.tags.length - 2}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {formatDate(contact.lastInteraction)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                          <DropdownMenuItem
                            onClick={() => setEditingContact(contact._id)}
                            className="text-gray-300 focus:text-white focus:bg-gray-800"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <Link href={`/chat/${contact._id}`}>
                            <DropdownMenuItem className="text-gray-300 focus:text-white focus:bg-gray-800">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              View Chat
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => setContactToDelete(contact._id)}
                            className="text-red-400 focus:text-red-300 focus:bg-red-950"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Edit Contact Dialog */}
      {editingContact && (
        <ContactDetailsDialog
          contactId={editingContact}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
        />
      )}

      {/* Import Dialog */}
      {tenant && instances && instances.length > 0 && (
        <ImportContactsDialog
          tenantId={tenant._id}
          instanceId={instances[0].instanceId}
          open={importOpen}
          onOpenChange={setImportOpen}
        />
      )}

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete {selectedContacts.size} contacts?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. All selected contacts and their conversation history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Single Delete Confirmation */}
      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete this contact?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. The contact and their conversation history will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSingle}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


