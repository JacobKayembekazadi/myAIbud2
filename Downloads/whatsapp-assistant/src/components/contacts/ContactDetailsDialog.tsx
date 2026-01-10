"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { X, Plus, User, Phone, Calendar, MessageSquare, Tag } from "lucide-react";
import { toast } from "sonner";

interface ContactDetailsDialogProps {
  contactId: Id<"contacts">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailsDialog({
  contactId,
  open,
  onOpenChange,
}: ContactDetailsDialogProps) {
  const contact = useQuery(api.contacts.getContact, { contactId });
  const updateContact = useMutation(api.contacts.updateContact);

  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (contact) {
      setName(contact.name ?? "");
      setNotes(contact.notes ?? "");
      setStatus(contact.status);
      setTags(contact.tags ?? []);
    }
  }, [contact]);

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateContact({
        contactId,
        name: name || undefined,
        notes: notes || undefined,
        status,
        tags,
      });
      toast.success("Contact updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update contact");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp).toLocaleDateString([], {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!contact) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Edit Contact
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Update contact details, tags, and notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-400">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact name"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Phone (read-only) */}
          <div className="space-y-2">
            <Label className="text-gray-400 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              value={contact.phone}
              disabled
              className="bg-gray-800/50 border-gray-700 text-gray-400"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-gray-400">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="active">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </SelectItem>
                <SelectItem value="paused">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Paused
                  </span>
                </SelectItem>
                <SelectItem value="new">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    New
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-gray-400 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-gray-800 text-gray-300 hover:bg-gray-700 pr-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 p-0.5 hover:bg-gray-600 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="bg-gray-800 border-gray-700 text-white flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTag}
                className="border-gray-700 text-gray-400 hover:text-white shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-gray-400">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this contact..."
              rows={3}
              className="bg-gray-800 border-gray-700 text-white resize-none"
            />
          </div>

          <Separator className="bg-gray-800" />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Created
              </p>
              <p className="text-gray-300">{formatDate(contact.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Last Active
              </p>
              <p className="text-gray-300">{formatDate(contact.lastInteraction)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


