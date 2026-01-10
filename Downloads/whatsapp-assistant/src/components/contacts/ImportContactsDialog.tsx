"use client";

import { useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download } from "lucide-react";
import { toast } from "sonner";

interface ImportContactsDialogProps {
  tenantId: Id<"tenants">;
  instanceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedContact {
  phone: string;
  name?: string;
  tags?: string[];
  notes?: string;
  valid: boolean;
  error?: string;
}

export function ImportContactsDialog({
  tenantId,
  instanceId,
  open,
  onOpenChange,
}: ImportContactsDialogProps) {
  const importContacts = useMutation(api.contacts.importContacts);

  const [file, setFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const parseCSV = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      setParseErrors(["CSV file must have a header row and at least one contact"]);
      return [];
    }

    // Parse header
    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const phoneIndex = header.findIndex((h) => h === "phone" || h === "phone number" || h === "telephone");
    const nameIndex = header.findIndex((h) => h === "name" || h === "contact name" || h === "full name");
    const tagsIndex = header.findIndex((h) => h === "tags" || h === "labels");
    const notesIndex = header.findIndex((h) => h === "notes" || h === "comments");

    if (phoneIndex === -1) {
      setParseErrors(["CSV must have a 'phone' column"]);
      return [];
    }

    const contacts: ParsedContact[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const phone = values[phoneIndex]?.replace(/[^0-9+]/g, "");

      if (!phone) {
        errors.push(`Row ${i + 1}: Missing phone number`);
        continue;
      }

      if (phone.length < 10) {
        contacts.push({
          phone,
          name: nameIndex >= 0 ? values[nameIndex] : undefined,
          valid: false,
          error: "Invalid phone number",
        });
        continue;
      }

      const tags = tagsIndex >= 0 && values[tagsIndex]
        ? values[tagsIndex].split(";").map((t) => t.trim()).filter(Boolean)
        : undefined;

      contacts.push({
        phone,
        name: nameIndex >= 0 ? values[nameIndex] : undefined,
        tags,
        notes: notesIndex >= 0 ? values[notesIndex] : undefined,
        valid: true,
      });
    }

    setParseErrors(errors);
    return contacts;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    setParseErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const contacts = parseCSV(text);
      setParsedContacts(contacts);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    const validContacts = parsedContacts.filter((c) => c.valid);
    if (validContacts.length === 0) {
      toast.error("No valid contacts to import");
      return;
    }

    setIsLoading(true);
    setImportProgress(0);

    try {
      const result = await importContacts({
        tenantId,
        instanceId,
        contacts: validContacts.map((c) => ({
          phone: c.phone,
          name: c.name,
          tags: c.tags,
          notes: c.notes,
        })),
      });

      setImportProgress(100);
      toast.success(`Imported ${result.imported} contacts, updated ${result.updated} existing`);
      
      // Reset and close
      setTimeout(() => {
        setFile(null);
        setParsedContacts([]);
        setImportProgress(0);
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      toast.error("Failed to import contacts");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedContacts([]);
    setParseErrors([]);
    setImportProgress(0);
  };

  const downloadSample = () => {
    const sampleCSV = `phone,name,tags,notes
+1234567890,John Doe,customer;vip,VIP customer from referral
+0987654321,Jane Smith,lead,Interested in product demo
+5551234567,Bob Wilson,customer,Regular customer`;
    
    const blob = new Blob([sampleCSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedContacts.filter((c) => c.valid).length;
  const invalidCount = parsedContacts.filter((c) => !c.valid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-500" />
            Import Contacts
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Upload a CSV file to import contacts. Required columns: phone. Optional: name, tags, notes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4 py-4">
          {!file ? (
            <div className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-emerald-600/50 transition-colors">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  Drag and drop a CSV file here, or click to browse
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 cursor-pointer"
                  onClick={() => document.getElementById("csv-upload")?.click()}
                >
                  Choose File
                </Button>
              </div>

              {/* Sample Download */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={downloadSample}
                  className="text-emerald-500 hover:text-emerald-400"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download sample CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <span className="text-white">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReset}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-gray-300">{validCount} valid</span>
                </div>
                {invalidCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-gray-300">{invalidCount} invalid</span>
                  </div>
                )}
              </div>

              {/* Parse Errors */}
              {parseErrors.length > 0 && (
                <Alert className="bg-red-950/30 border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {parseErrors.slice(0, 3).join(", ")}
                    {parseErrors.length > 3 && ` and ${parseErrors.length - 3} more errors`}
                  </AlertDescription>
                </Alert>
              )}

              {/* Import Progress */}
              {isLoading && (
                <div className="space-y-2">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-sm text-gray-400 text-center">Importing contacts...</p>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-gray-800 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400 w-10"></TableHead>
                      <TableHead className="text-gray-400">Phone</TableHead>
                      <TableHead className="text-gray-400">Name</TableHead>
                      <TableHead className="text-gray-400">Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedContacts.slice(0, 50).map((contact, idx) => (
                      <TableRow key={idx} className="border-gray-800">
                        <TableCell>
                          {contact.valid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-gray-300">{contact.phone}</TableCell>
                        <TableCell className="text-gray-400">
                          {contact.name || <span className="text-gray-600">—</span>}
                        </TableCell>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {parsedContacts.length > 50 && (
                  <p className="text-center py-2 text-sm text-gray-500">
                    Showing 50 of {parsedContacts.length} contacts
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          {file && (
            <Button
              onClick={handleImport}
              disabled={isLoading || validCount === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? "Importing..." : `Import ${validCount} Contacts`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


