"use client";

import { useState, useEffect } from "react";
import { Search, User, BookOpen, Users, Compass, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<"all" | "users" | "topics">("all");

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [query]);

    return (
        <div className="feed-column space-y-6">
            {/* Header & Search Bar - Enlarged Touch Target Input */}
            <div className="glass-card p-5 sm:p-6 border rounded-2xl shadow-md space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-dark)" }}>Search Egram</h1>
                
                <div className="relative flex items-center">
                    <Search className="w-5.5 h-5.5 absolute left-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search students, topics, or study rooms..."
                        className="w-full border rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base font-medium outline-none transition-all min-h-[48px]"
                        style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)", color: "var(--text-dark)" }}
                    />
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                    {[
                        { id: "all", label: "All Results" },
                        { id: "users", label: "Students" },
                        { id: "topics", label: "Study Topics" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveFilter(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex-shrink-0 ${
                                activeFilter === tab.id
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : ""
                            }`}
                            style={{
                                backgroundColor: activeFilter === tab.id ? undefined : "var(--accent-bg)",
                                borderColor: activeFilter === tab.id ? undefined : "var(--card-border)",
                                color: activeFilter === tab.id ? "#ffffff" : "var(--text-light)",
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-3">
                {loading ? (
                    <div className="p-8 text-center text-sm font-bold flex items-center justify-center gap-2" style={{ color: "var(--text-light)" }}>
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>Searching Egram...</span>
                    </div>
                ) : results.length === 0 ? (
                    query.trim() ? (
                        <div className="glass-card p-8 border rounded-2xl text-center space-y-2" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                            <Compass className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
                            <p className="text-sm sm:text-base font-bold" style={{ color: "var(--text-dark)" }}>No results found for "{query}"</p>
                            <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-light)" }}>Try searching for a different keyword or student name.</p>
                        </div>
                    ) : (
                        <div className="glass-card p-8 border rounded-2xl text-center space-y-2" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                            <Search className="w-8 h-8 text-blue-500 mx-auto opacity-60" />
                            <p className="text-sm sm:text-base font-bold" style={{ color: "var(--text-dark)" }}>Type to search across Egram</p>
                            <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-light)" }}>Find classmates, machine learning study rooms, and topics.</p>
                        </div>
                    )
                ) : (
                    results.map(user => (
                        <Link
                            key={user.firebaseUid || user._id}
                            href={`/profile/${user.firebaseUid}`}
                            className="glass-card p-4 sm:p-5 border rounded-2xl flex items-center justify-between gap-4 hover:border-blue-500/40 transition-all block min-h-[64px]"
                            style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
                        >
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5 flex-shrink-0">
                                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-sm" style={{ backgroundColor: "var(--background)", color: "var(--primary)" }}>
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{user.name?.substring(0, 2).toUpperCase() || 'ST'}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-base font-extrabold truncate" style={{ color: "var(--text-dark)" }}>{user.name}</span>
                                        <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-medium truncate" style={{ color: "var(--text-light)" }}>
                                        {user.bio || `@${user.name?.toLowerCase().replace(/\s+/g, '')}`}
                                    </span>
                                </div>
                            </div>

                            <span className="px-3.5 py-1.5 rounded-full border text-xs font-bold text-blue-500 flex-shrink-0" style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}>
                                View Profile
                            </span>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
