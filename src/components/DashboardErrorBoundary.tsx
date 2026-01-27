"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/errors";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry and console
    logError(error, {
      componentStack: errorInfo.componentStack,
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
      errorBoundary: "DashboardErrorBoundary",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-white mb-2">
                Dashboard Error
              </h1>

              {/* Error Message */}
              <p className="text-gray-400 mb-6">
                {this.state.error?.message ||
                  "We're having trouble loading your dashboard. This might be a temporary issue."}
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-400 mb-2">
                    Technical Details
                  </summary>
                  <div className="bg-gray-800 rounded p-3 text-xs text-gray-300 overflow-auto max-h-48">
                    <pre className="whitespace-pre-wrap break-words">
                      {this.state.error.stack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.reload();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Dashboard
                </Button>

                <Button
                  onClick={() => (window.location.href = "/instances")}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Instances
                </Button>
              </div>
            </div>

            {/* Support Message */}
            <p className="text-center text-sm text-gray-500 mt-4">
              If this problem persists, try:
            </p>
            <ul className="text-center text-xs text-gray-600 mt-2 space-y-1">
              <li>• Clear your browser cache and cookies</li>
              <li>• Check your internet connection</li>
              <li>• Try accessing from a different page</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
