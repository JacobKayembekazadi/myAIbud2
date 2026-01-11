"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  QrCode,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";

// Import the QR code fetch action
import { getQRCode, checkInstanceStatus } from "@/app/instances/actions";

interface ScanQRStepProps {
  instanceId: string;
  onConnected: () => void;
  onSkip: () => void;
}

export function ScanQRStep({ instanceId, onConnected, onSkip }: ScanQRStepProps) {
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const markWhatsAppConnected = useMutation(api.tenants.markWhatsAppConnected);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Fetch QR code
  const fetchQR = async () => {
    if (!instanceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getQRCode(instanceId);
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
        setCountdown(60);
      } else if (result.connected) {
        setIsConnected(true);
        if (tenant) {
          await markWhatsAppConnected({ tenantId: tenant._id });
        }
        setTimeout(onConnected, 1500);
      } else {
        setError(result.error || "Failed to get QR code");
      }
    } catch (err) {
      setError("Failed to fetch QR code");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Check connection status
  const checkStatus = async () => {
    if (!instanceId || isConnected) return;
    
    try {
      const result = await checkInstanceStatus(instanceId);
      if (result.connected) {
        setIsConnected(true);
        if (tenant) {
          await markWhatsAppConnected({ tenantId: tenant._id });
        }
        setTimeout(onConnected, 1500);
      }
    } catch (err) {
      console.error("Error checking status:", err);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (instanceId) {
      fetchQR();
    }
  }, [instanceId]);

  // Poll for connection status
  useEffect(() => {
    if (isConnected || !instanceId) return;
    
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [instanceId, isConnected, tenant]);

  // Countdown timer for QR refresh
  useEffect(() => {
    if (isConnected || !qrCode) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchQR();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [qrCode, isConnected]);

  if (isConnected) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Connected! 🎉</h2>
        <p className="text-gray-400">Your WhatsApp is now linked to MyChatFlow</p>
        <Badge className="mt-4 bg-emerald-600/20 text-emerald-400 border-0">
          Redirecting to next step...
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Scan QR Code</h2>
        <p className="text-gray-400 text-sm">
          Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
        </p>
      </div>

      {/* QR Code Display */}
      <Card className="bg-gray-800/50 border-gray-700 overflow-hidden">
        <CardContent className="p-6">
          <div className="aspect-square max-w-[280px] mx-auto bg-white rounded-xl p-4 relative">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-sm text-gray-600 text-center mb-4">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchQR}
                  className="text-gray-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : qrCode ? (
              <>
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {countdown}s
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <QrCode className="w-16 h-16 text-gray-300" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-emerald-400">1</span>
          </div>
          <div>
            <p className="text-sm text-white">Open WhatsApp on your phone</p>
            <p className="text-xs text-gray-500">Use the main phone with the number you want to connect</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-emerald-400">2</span>
          </div>
          <div>
            <p className="text-sm text-white">Go to Settings → Linked Devices</p>
            <p className="text-xs text-gray-500">Tap the three dots menu on Android, or Settings on iOS</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs font-bold text-emerald-400">3</span>
          </div>
          <div>
            <p className="text-sm text-white">Tap &quot;Link a Device&quot; and scan this QR</p>
            <p className="text-xs text-gray-500">Point your camera at the code above</p>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          variant="ghost"
          onClick={fetchQR}
          disabled={isLoading}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh QR Code
        </Button>
      </div>
    </div>
  );
}



