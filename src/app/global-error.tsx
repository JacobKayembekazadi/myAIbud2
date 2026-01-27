"use client";

import { useEffect } from "react";
import { logError } from "@/lib/errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical error
    logError(error, {
      digest: error.digest,
      level: "critical",
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            background: "#1a1a1a",
            border: "1px solid #2a2a2a",
            borderRadius: "0.5rem",
            padding: "2rem",
            textAlign: "center",
          }}>
            <div style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f87171"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <path d="M12 9v4"/>
                <path d="M12 17h.01"/>
              </svg>
            </div>

            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#ffffff",
              marginBottom: "0.5rem",
            }}>
              Critical Error
            </h1>

            <p style={{
              color: "#9ca3af",
              marginBottom: "1.5rem",
            }}>
              {error.message || "A critical error occurred. Please refresh the page."}
            </p>

            <button
              onClick={reset}
              style={{
                backgroundColor: "#10b981",
                color: "#ffffff",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
                marginRight: "0.5rem",
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#059669"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#10b981"}
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.href = "/"}
              style={{
                backgroundColor: "transparent",
                color: "#9ca3af",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #374151",
                cursor: "pointer",
                fontWeight: "500",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#1f2937";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#9ca3af";
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
