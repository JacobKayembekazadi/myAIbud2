"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportContactsButtonProps {
  tenantId: Id<"tenants">;
}

export function ExportContactsButton({ tenantId }: ExportContactsButtonProps) {
  const contacts = useQuery(api.contacts.getContactsForExport, { tenantId });

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
          `"${contact.name.replace(/"/g, '""')}"`,
          `"${contact.status}"`,
          `"${contact.tags.replace(/"/g, '""')}"`,
          `"${contact.notes.replace(/"/g, '""')}"`,
          `"${contact.createdAt}"`,
          `"${contact.lastInteraction}"`,
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

