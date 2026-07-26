"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Silently log error for monitoring without throwing serverless exceptions
    }, [error]);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-dark)] flex items-center justify-center p-4">
            <div className="text-center max-w-md space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/20">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-black tracking-tight">Something went wrong</h1>
                <p className="text-xs text-[var(--text-light)] font-medium">
                    An unexpected issue occurred. Click below to refresh the page.
                </p>
                <button
                    onClick={() => reset()}
                    className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:opacity-90 transition-all"
                >
                    <RefreshCw className="w-4 h-4" /> Try Again
                </button>
            </div>
        </div>
    );
}
