"use client";

import { useState } from "react";
import { Compass, Sparkles, BookOpen, Users, Video, TrendingUp, Flame, ArrowRight, ShieldCheck, Search } from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
    const [searchQuery, setSearchQuery] = useState("");

    const categories = [
        { id: "ai", title: "Artificial Intelligence & ML", count: "1.2k Study Notes", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10" },
        { id: "webdev", title: "Web Development & Next.js", count: "890 Code Snippets", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "circles", title: "Active Student Circles", count: "45 Study Groups", icon: Users, color: "text-pink-500", bg: "bg-pink-500/10" },
        { id: "rooms", title: "Live Video Rooms", count: "12 Session Rooms", icon: Video, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    const trendingTopics = [
        { name: "#MachineLearning", posts: "2.4k posts", growth: "+45% this week" },
        { name: "#SystemDesign", posts: "1.8k posts", growth: "+30% this week" },
        { name: "#Calculus", posts: "950 posts", growth: "+15% this week" },
        { name: "#CyberSecurity", posts: "1.1k posts", growth: "+22% this week" },
    ];

    const featuredRooms = [
        { id: "r1", topic: "Late Night Machine Learning Code & Review", host: "Adi Chowdary", members: "8 members live", status: "Live" },
        { id: "r2", topic: "Calculus III Problem Solving Room", host: "Ananya Sharma", members: "5 members live", status: "Live" },
    ];

    const featuredCircles = [
        { id: "c1", name: "AI & Neural Networks Club", members: "340 Students", tag: "Tech" },
        { id: "c2", name: "Full Stack Developers Circle", members: "512 Students", tag: "Coding" },
    ];

    return (
        <div className="feed-column space-y-6">
            {/* 1. Discover Hub Header Widget */}
            <div className="glass-card p-5 sm:p-6 border rounded-2xl shadow-md space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                            <Compass className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-dark)" }}>Discover Hub</h1>
                            <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-light)" }}>Explore study rooms, circles, and trending topics across Egram.</p>
                        </div>
                    </div>
                </div>

                {/* Quick Search */}
                <div className="relative flex items-center pt-1">
                    <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none z-10" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search topics, rooms, or circles..."
                        className="w-full border rounded-2xl pl-12 pr-4 py-3 text-xs sm:text-sm font-medium outline-none transition-all min-h-[46px]"
                        style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)", color: "var(--text-dark)" }}
                    />
                </div>
            </div>

            {/* 2. Featured Categories Grid */}
            <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider px-1" style={{ color: "var(--text-light)" }}>Study Hub Categories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                            <Link
                                key={cat.id}
                                href={`/search?q=${encodeURIComponent(cat.title)}`}
                                className="glass-card p-5 border rounded-2xl flex flex-col justify-between gap-4 hover:border-blue-500/40 transition-all group min-h-[110px]"
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

            {/* 3. Live Study Rooms Spotlight */}
            <div className="glass-card p-5 sm:p-6 border rounded-2xl shadow-md space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-blue-500" />
                        <h2 className="text-base font-black" style={{ color: "var(--text-dark)" }}>Live Study Rooms</h2>
                    </div>
                    <Link href="/study" className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1">
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="space-y-3">
                    {featuredRooms.map(room => (
                        <div
                            key={room.id}
                            className="p-4 rounded-xl border flex items-center justify-between gap-3"
                            style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}
                        >
                            <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-dark)" }}>{room.topic}</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 flex-shrink-0">
                                        {room.status}
                                    </span>
                                </div>
                                <p className="text-xs font-medium" style={{ color: "var(--text-light)" }}>Host: {room.host} • {room.members}</p>
                            </div>

                            <Link href="/study" className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 shadow-sm flex-shrink-0">
                                Join Room
                            </Link>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Trending Topics Section */}
            <div className="glass-card p-5 sm:p-6 border rounded-2xl shadow-md space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base font-black" style={{ color: "var(--text-dark)" }}>Trending Topics</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trendingTopics.map(topic => (
                        <Link
                            key={topic.name}
                            href={`/search?q=${encodeURIComponent(topic.name.replace('#', ''))}`}
                            className="p-3.5 rounded-xl border flex items-center justify-between gap-2 hover:border-blue-500/40 transition-all"
                            style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}
                        >
                            <div>
                                <h3 className="text-sm font-bold text-blue-500">{topic.name}</h3>
                                <p className="text-xs font-medium" style={{ color: "var(--text-light)" }}>{topic.posts}</p>
                            </div>
                            <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                {topic.growth}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
