"use client";

import { useState, useEffect } from "react";
import { Compass, Sparkles, BookOpen, Users, Video, TrendingUp, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRooms } from "@/hooks/useRooms";

export default function DiscoverPage() {
    const { rooms, loading: loadingRooms } = useRooms();
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch(`/api/users?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setAllStudents(data.data || []);
                }
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
    }, []);

    const categories = [
        { id: "ai", title: "Artificial Intelligence & ML", count: "1.2k Study Notes", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10" },
        { id: "webdev", title: "Web Development & Next.js", count: "890 Code Snippets", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "circles", title: "Active Student Circles", count: "45 Study Groups", icon: Users, color: "text-pink-500", bg: "bg-pink-500/10" },
        { id: "rooms", title: "Live Video Rooms", count: `${rooms.length} Running Rooms`, icon: Video, color: "text-purple-500", bg: "bg-purple-500/10" },
    ];

    return (
        <div className="feed-column space-y-6">
            {/* 1. Discover Hub Header */}
            <div className="glass-card p-5 sm:p-6 border rounded-2xl shadow-md space-y-2" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                        <Compass className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: "var(--text-dark)" }}>Discover Hub</h1>
                        <p className="text-xs sm:text-sm font-medium mt-0.5" style={{ color: "var(--text-light)" }}>Explore all registered student profiles and live study rooms on Egram.</p>
                    </div>
                </div>
            </div>

            {/* 2. Live Study Rooms - Real Feed & Clean Empty State */}
            <div className="glass-card p-5 sm:p-6 border rounded-2xl shadow-md space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Video className="w-5.5 h-5.5 text-blue-500" />
                        <h2 className="text-base sm:text-lg font-black" style={{ color: "var(--text-dark)" }}>Live Study Rooms</h2>
                    </div>
                    <Link href="/study" className="text-xs sm:text-sm font-bold text-blue-500 hover:underline flex items-center gap-1">
                        <span>Explore All</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="space-y-3">
                    {loadingRooms ? (
                        <div className="space-y-2">
                            {[1, 2].map(i => (
                                <div key={i} className="h-16 rounded-xl skeleton-shimmer" style={{ backgroundColor: "var(--accent-bg)" }} />
                            ))}
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="p-6 rounded-2xl border border-dashed text-center space-y-2" style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}>
                            <Video className="w-8 h-8 text-blue-500 mx-auto opacity-70" />
                            <p className="text-sm font-bold" style={{ color: "var(--text-dark)" }}>No study room is currently running</p>
                            <p className="text-xs font-medium" style={{ color: "var(--text-light)" }}>Create a live video study room & invite your friends!</p>
                        </div>
                    ) : (
                        rooms.map(room => (
                            <div
                                key={room.id}
                                className="p-4 rounded-xl border flex items-center justify-between gap-3"
                                style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-dark)" }}>{room.topic}</h3>
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 flex-shrink-0">
                                            Live
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium" style={{ color: "var(--text-light)" }}>Host: {room.hostName} • {room.scheduleTime}</p>
                                </div>

                                <Link href="/study" className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 shadow-sm flex-shrink-0">
                                    Join Room
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 3. All Registered Egram Student Accounts */}
            <div className="glass-card p-5 sm:p-6 border rounded-2xl shadow-md space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5.5 h-5.5 text-purple-500" />
                        <h2 className="text-base sm:text-lg font-black" style={{ color: "var(--text-dark)" }}>Egram Student Directory</h2>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border text-purple-500" style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}>
                        {allStudents.length} Registered Students
                    </span>
                </div>

                <div className="space-y-3">
                    {loadingStudents ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 rounded-2xl skeleton-shimmer" style={{ backgroundColor: "var(--accent-bg)" }} />
                            ))}
                        </div>
                    ) : allStudents.length === 0 ? (
                        <div className="p-6 rounded-2xl border border-dashed text-center" style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}>
                            <p className="text-xs sm:text-sm font-semibold" style={{ color: "var(--text-light)" }}>No student accounts found.</p>
                        </div>
                    ) : (
                        allStudents.map(student => (
                            <Link
                                key={student.firebaseUid || student._id}
                                href={`/profile/${student.firebaseUid}`}
                                className="p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 hover:border-blue-500/40 transition-all block"
                                style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}
                            >
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5 flex-shrink-0">
                                        <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-xs" style={{ backgroundColor: "var(--background)", color: "var(--primary)" }}>
                                            {student.avatarUrl ? (
                                                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{student.name?.substring(0, 2).toUpperCase() || 'ST'}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className="text-sm sm:text-base font-extrabold truncate" style={{ color: "var(--text-dark)" }}>{student.name}</span>
                                            <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                        </div>
                                        <span className="text-xs font-medium truncate" style={{ color: "var(--text-light)" }}>
                                            {student.bio || `@${student.name?.toLowerCase().replace(/\s+/g, '')}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                    {student.currentStreak > 0 && (
                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20">
                                            🔥 {student.currentStreak}d
                                        </span>
                                    )}
                                    <span className="px-5 py-2.5 rounded-full border text-xs sm:text-sm font-bold text-blue-500 min-h-[44px] flex items-center justify-center" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                                        View Profile
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* 4. Study Categories Grid */}
            <div className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider px-1" style={{ color: "var(--text-light)" }}>Study Categories</h2>
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
        </div>
    );
}
