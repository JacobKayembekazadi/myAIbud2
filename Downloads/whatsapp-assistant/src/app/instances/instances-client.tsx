"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchQRCode, createWhatsAppInstance, deleteWhatsAppInstance, getInstanceStatus, syncChats } from "./actions";
import { Plus, QrCode, Smartphone, Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, MessageCircle, Clock } from "lucide-react";
import { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";

function InstancesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Create Instance Card Skeleton */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 bg-gray-700" />
            <Skeleton className="h-6 w-40 bg-gray-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1 bg-gray-800" />
            <Skeleton className="h-10 w-[120px] bg-gray-800" />
          </div>
        </CardContent>
      </Card>

      {/* Instances List Skeleton */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 bg-gray-700" />
            <Skeleton className="h-6 w-32 bg-gray-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="w-3 h-3 rounded-full bg-gray-600" />
                  <div>
                    <Skeleton className="h-5 w-32 bg-gray-700" />
                    <Skeleton className="h-4 w-20 mt-1 bg-gray-700" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 bg-gray-700" />
                  <Skeleton className="h-8 w-8 bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const QR_EXPIRY_SECONDS = 60;
const STATUS_POLL_INTERVAL = 5000; // 5 seconds

export function InstancesClient() {
  const { userId } = useAuth();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<{ id: Id<"instances">; instanceId: string; name: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingChats, setSyncingChats] = useState<string | null>(null);
  const [qrExpiry, setQrExpiry] = useState<number>(QR_EXPIRY_SECONDS);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [currentQRInstance, setCurrentQRInstance] = useState<string | null>(null);
  const qrTimerRef = useRef<NodeJS.Timeout | null>(null);

  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const instances = useQuery(
    api.instances.listInstances,
    tenant ? { tenantId: tenant._id } : "skip"
  );
  const createInstance = useMutation(api.instances.createInstance);
  const deleteInstance = useMutation(api.instances.deleteInstance);
  const updateInstanceStatus = useMutation(api.instances.updateInstanceStatus);

  // Sync instance statuses from WAHA
  const syncStatuses = useCallback(async () => {
    if (!instances || instances.length === 0) return;
    setSyncing(true);
    let hasStatusChange = false;
    for (const instance of instances) {
      try {
        const result = await getInstanceStatus(instance.instanceId);
        if (result.status !== instance.status) {
          await updateInstanceStatus({
            instanceId: instance.instanceId,
            status: result.status,
          });
          hasStatusChange = true;
          // Show toast when status changes to connected
          if (result.status === "connected" && instance.status !== "connected") {
            toast.success(`${instance.name} is now connected!`);
          }
        }
      } catch (e) {
        console.error("Failed to sync status for", instance.name);
      }
    }
    setSyncing(false);
    return hasStatusChange;
  }, [instances, updateInstanceStatus]);

  // Auto-sync on mount and poll every 5 seconds
  useEffect(() => {
    if (instances && instances.length > 0) {
      syncStatuses();
    }
  }, [instances?.length, syncStatuses]);

  // Poll for status updates every 5 seconds
  useEffect(() => {
    if (!instances || instances.length === 0) return;

    const interval = setInterval(() => {
      syncStatuses();
    }, STATUS_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [instances, syncStatuses]);

  // QR code expiry countdown
  useEffect(() => {
    if (qrCode && qrDialogOpen) {
      setQrExpiry(QR_EXPIRY_SECONDS);
      
      qrTimerRef.current = setInterval(() => {
        setQrExpiry((prev) => {
          if (prev <= 1) {
            // QR expired, auto-refresh
            if (currentQRInstance) {
              handleShowQR(currentQRInstance);
            }
            return QR_EXPIRY_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (qrTimerRef.current) {
          clearInterval(qrTimerRef.current);
        }
      };
    }
  }, [qrCode, qrDialogOpen, currentQRInstance]);

  const handleCreate = async () => {
    if (!newName.trim() || !tenant) return;
    setIsCreating(true);
    setError("");

    try {
      const result = await createWhatsAppInstance(newName);
      if (result.error) {
        setError(result.error);
        toast.error(`Failed to create instance: ${result.error}`);
      } else if (result.instance) {
        await createInstance({
          tenantId: tenant._id,
          name: newName,
          instanceId: result.instance.instanceId,
        });
        setNewName("");
        toast.success(`Instance "${newName}" created successfully!`);
      }
    } catch (e) {
      setError("Failed to create instance");
      toast.error("Failed to create instance");
    }
    setIsCreating(false);
  };

  const handleShowQR = async (instanceId: string) => {
    setLoadingQR(true);
    setQrCode(null);
    setCurrentQRInstance(instanceId);
    setQrDialogOpen(true);
    const result = await fetchQRCode(instanceId);
    if (result.qr) {
      setQrCode(result.qr);
      setQrExpiry(QR_EXPIRY_SECONDS);
    } else if (result.error) {
      setError(result.error);
      toast.error(result.error);
    }
    setLoadingQR(false);
  };

  const handleRefreshQR = async () => {
    if (currentQRInstance) {
      await handleShowQR(currentQRInstance);
      toast.info("QR code refreshed");
    }
  };

  const handleDeleteClick = (instance: { _id: Id<"instances">; instanceId: string; name: string }) => {
    setInstanceToDelete({ id: instance._id, instanceId: instance.instanceId, name: instance.name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!instanceToDelete) return;

    setDeletingId(instanceToDelete.instanceId);
    setError("");

    try {
      // Delete from WhatsApp provider
      const result = await deleteWhatsAppInstance(instanceToDelete.instanceId);
      if (result.error) {
        setError(result.error);
        toast.error(`Failed to delete: ${result.error}`);
      } else {
        // Delete from Convex database
        await deleteInstance({ instanceId: instanceToDelete.id });
        toast.success(`Instance "${instanceToDelete.name}" deleted`);
      }
    } catch (e) {
      setError("Failed to delete instance");
      toast.error("Failed to delete instance");
    }

    setDeletingId(null);
    setDeleteDialogOpen(false);
    setInstanceToDelete(null);
  };

  const handleSyncChats = async (instanceId: string) => {
    if (!tenant) return;

    setSyncingChats(instanceId);
    setError("");

    try {
      const result = await syncChats(instanceId, tenant._id);
      if (result.error) {
        setError(result.error);
        toast.error(`Failed to sync: ${result.error}`);
      } else {
        toast.success(`Imported ${result.importedCount} contacts`);
      }
    } catch (e) {
      setError("Failed to sync chats");
      toast.error("Failed to sync chats");
    }

    setSyncingChats(null);
  };

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Please sign in to continue</p>
      </div>
    );
  }

  if (!tenant || instances === undefined) {
    return <InstancesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Create Instance Card */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-500" />
            Create New Instance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter instance name (e.g., My Business Phone)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newName.trim()}
              className="bg-green-600 hover:bg-green-700 min-w-[120px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
              <XCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instances List */}
      <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-500" />
            Your Instances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {instances === undefined ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
              <span className="ml-2 text-gray-400">Loading instances...</span>
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No instances yet</p>
              <p className="text-gray-500 text-sm">Create your first instance above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {instances.map((instance) => (
                <div
                  key={instance._id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${instance.status === "connected" ? "bg-green-500" :
                      instance.status === "connecting" ? "bg-yellow-500 animate-pulse" :
                        "bg-gray-500"
                      }`} />
                    <div>
                      <p className="text-white font-medium">{instance.name}</p>
                      <p className="text-gray-500 text-sm flex items-center gap-1">
                        {instance.status === "connected" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            Connected
                          </>
                        ) : (
                          <>
                            <span className="capitalize">{instance.status}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowQR(instance.instanceId)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Show QR
                    </Button>

                    {instance.status === "connected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncChats(instance.instanceId)}
                        disabled={syncingChats === instance.instanceId}
                        className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                      >
                        {syncingChats === instance.instanceId ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <MessageCircle className="w-4 h-4 mr-2" />
                        )}
                        Sync Chats
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(instance)}
                      disabled={deletingId === instance.instanceId}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      {deletingId === instance.instanceId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Instance
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete "{instanceToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deletingId !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={(open) => {
        setQrDialogOpen(open);
        if (!open) {
          setQrCode(null);
          setCurrentQRInstance(null);
          if (qrTimerRef.current) {
            clearInterval(qrTimerRef.current);
          }
        }
      }}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-green-500" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Scan this QR code with WhatsApp to link your device. QR codes expire after 60 seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {loadingQR ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-4" />
                <p className="text-gray-400">Generating QR code...</p>
              </div>
            ) : qrCode ? (
              <>
                <div className="relative">
                  <img src={qrCode} alt="QR Code" className="w-64 h-64 rounded-lg" />
                  {/* Expiry countdown overlay */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-800 px-3 py-1 rounded-full flex items-center gap-1.5 border border-gray-600">
                    <Clock className={`w-3.5 h-3.5 ${qrExpiry <= 10 ? 'text-red-400' : 'text-gray-400'}`} />
                    <span className={`text-sm font-mono ${qrExpiry <= 10 ? 'text-red-400' : 'text-gray-300'}`}>
                      {qrExpiry}s
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-6 text-center">
                  Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshQR}
                  className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh QR
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <XCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-gray-400 text-center">Failed to generate QR code</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshQR}
                  className="mt-4 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
