"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorFallbackProps {
  error: Error;
  reset?: () => void;
  showHomeButton?: boolean;
}

export function ErrorFallback({ error, reset, showHomeButton = true }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>

          {/* Error Message */}
          <p className="text-gray-400 mb-6">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>

          {/* Error Details (Development Only) */}
          {process.env.NODE_ENV === "development" && (
            <details className="mb-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
                Technical Details
              </summary>
              <div className="bg-gray-800 rounded p-3 text-xs text-gray-300 overflow-auto max-h-48">
                <pre className="whitespace-pre-wrap break-words">{error.stack}</pre>
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {reset && (
              <Button
                onClick={reset}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}

            {showHomeButton && (
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </div>

        {/* Support Message */}
        <p className="text-center text-sm text-gray-500 mt-4">
          If this problem persists, please contact support
        </p>
      </div>
    </div>
  );
}
