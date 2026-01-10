"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  phone: string;
  name?: string;
  status: string;
  tags?: string[];
  notes?: string;
  createdAt: number;
  lastInteraction?: number;
}

interface ExportContactsButtonProps {
  contacts: Contact[] | undefined;
}

export function ExportContactsButton({ contacts }: ExportContactsButtonProps) {
  const handleExport = () => {
    if (!contacts || contacts.length === 0) {
      toast.error("No contacts to export");
      return;
    }

    // Create CSV content
    const headers = ["phone", "name", "status", "tags", "notes", "createdAt", "lastInteraction"];
    const csvRows = [
      headers.join(","),
      ...contacts.map((contact) =>
        [
          `"${contact.phone}"`,
          `"${(contact.name ?? "").replace(/"/g, '""')}"`,
          `"${contact.status}"`,
          `"${(contact.tags?.join(";") ?? "").replace(/"/g, '""')}"`,
          `"${(contact.notes ?? "").replace(/"/g, '""')}"`,
          `"${new Date(contact.createdAt).toISOString()}"`,
          `"${contact.lastInteraction ? new Date(contact.lastInteraction).toISOString() : ""}"`,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${contacts.length} contacts`);
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={!contacts || contacts.length === 0}
      className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
    >
      <Download className="w-4 h-4 mr-2" />
      Export
    </Button>
  );
}
