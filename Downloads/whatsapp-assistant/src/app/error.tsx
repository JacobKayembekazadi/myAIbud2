"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/ErrorFallback";
import { logError } from "@/lib/errors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console and external service
    logError(error, {
      digest: error.digest,
      route: window.location.pathname,
    });
  }, [error]);

  return <ErrorFallback error={error} reset={reset} />;
}
