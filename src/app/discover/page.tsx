"use client";

import { Compass, Sparkles, BookOpen, Users, Video, TrendingUp, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
    const categories = [
        { id: "ai", title: "Artificial Intelligence & ML", count: "1.2k Study Notes", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10" },
        { id: "webdev", title: "Web Development & Next.js", count: "890 Code Snippets", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "circles", title: "Active Student Circles", count: "45 Study Groups", icon: Users, color: "text-pink-500", bg: "bg-pink-500/10" },
        { id: "rooms", title: "Live Video Rooms", count: "12 Session Rooms", icon: Video, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="feed-column space-y-6">
            {/* Header Widget */}
            <div className="glass-card p-5 sm:p-6 border rounded-2xl shadow-md space-y-2" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-2.5">
                    <Compass className="w-6 h-6 text-blue-500" />
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-dark)" }}>Discover Hub</h1>
                </div>
                <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text-light)" }}>
                    Explore trending study topics, active student circles, and join live learning video sessions.
                </p>
            </div>

            {/* Discover Cards Grid - Enlarged 64px+ Touch Target Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <Link
                            key={cat.id}
                            href={`/search?q=${encodeURIComponent(cat.title)}`}
                            className="glass-card p-5 sm:p-6 border rounded-2xl flex flex-col justify-between gap-4 hover:border-blue-500/40 transition-all group min-h-[110px]"
                            style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className={`p-3 rounded-2xl ${cat.bg} flex-shrink-0`}>
                                    <Icon className={`w-6 h-6 ${cat.color}`} />
                                </div>
                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base sm:text-lg font-black tracking-tight" style={{ color: "var(--text-dark)" }}>{cat.title}</h3>
                                <p className="text-xs sm:text-sm font-semibold" style={{ color: "var(--text-light)" }}>{cat.count}</p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
