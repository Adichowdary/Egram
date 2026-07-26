import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-dark)] flex items-center justify-center p-4">
            <div className="text-center max-w-md space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 text-[var(--primary)] flex items-center justify-center mx-auto border border-purple-500/20">
                    <FileQuestion className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black tracking-tight">404 - Page Not Found</h1>
                <p className="text-xs text-[var(--text-light)] font-medium">
                    The page or resource you are looking for does not exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-2xl text-xs font-black shadow-lg hover:opacity-90 transition-all"
                >
                    <Home className="w-4 h-4" /> Back to Home
                </Link>
            </div>
        </div>
    );
}
