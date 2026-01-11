"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Import the createInstance action
import { createInstance } from "@/app/instances/actions";

interface CreateInstanceStepProps {
  tenantId: Id<"tenants">;
  onInstanceCreated: (instanceId: string) => void;
  onSkip: () => void;
}

export function CreateInstanceStep({
  tenantId,
  onInstanceCreated,
  onSkip,
}: CreateInstanceStepProps) {
  const [instanceName, setInstanceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markInstanceCreated = useMutation(api.tenants.markInstanceCreated);

  const handleCreate = async () => {
    if (!instanceName.trim()) {
      setError("Please enter an instance name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createInstance(tenantId, instanceName.trim());
      
      if (result.success && result.instanceId) {
        await markInstanceCreated({ tenantId });
        toast.success("Instance created successfully!");
        onInstanceCreated(result.instanceId);
      } else {
        setError(result.error || "Failed to create instance");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Create Your Instance</h2>
        <p className="text-gray-400 text-sm">
          An instance connects to one WhatsApp phone number. Give it a memorable name.
        </p>
      </div>

      {/* Form */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instanceName" className="text-gray-300">
              Instance Name
            </Label>
            <Input
              id="instanceName"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="e.g., Main Business, Support Line..."
              className="bg-gray-900 border-gray-600 text-white placeholder:text-gray-500"
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <p className="text-xs text-gray-500">
              This helps you identify the instance if you have multiple lines
            </p>
          </div>

          {error && (
            <Alert className="bg-red-950/30 border-red-800">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-300">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-2" />
          <p className="text-xs text-gray-400">One instance = one WhatsApp number</p>
        </div>
        <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-2" />
          <p className="text-xs text-gray-400">You can create more instances later</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onSkip}
          className="flex-1 border-gray-700 text-gray-400 hover:text-white"
          disabled={isLoading}
        >
          Skip for now
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isLoading || !instanceName.trim()}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Instance"
          )}
        </Button>
      </div>
    </div>
  );
}



