"use client";

import { User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogOut, Video, BookOpen, Flame, ArrowRight, ShieldCheck, Compass, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRooms } from "@/hooks/useRooms";
import { useUserProfile } from "@/hooks/useUserProfile";

interface RightSidebarProps {
    user: User;
    handleSignOut?: () => void;
    getInitials: (name: string | null) => string;
}

export function RightSidebar({ user, handleSignOut, getInitials }: RightSidebarProps) {
    const { rooms, loading: loadingRooms } = useRooms();
    const { userPhoto, userName, userStreak } = useUserProfile(user);

    const quickLinks = [
        { label: "Study Rooms", href: "/study", tag: "Live" },
        { label: "Student Circles", href: "/circles", tag: "Hot" },
        { label: "Discover Hub", href: "/discover", tag: "Explore" },
    ];

    return (
        <aside className="right-sidebar space-y-5 select-none">
            {/* 1. Mini Profile Card Widget */}
            <div className="glass-card p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-4" style={{ backgroundColor: "var(--surface)" }}>
                <div className="flex items-center justify-between gap-3">
                    <Link href={`/profile/${user.uid}`} className="flex items-center gap-3.5 group min-w-0 flex-1 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl">
                        <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-sm flex-shrink-0">
                            <div className="w-full h-full rounded-full p-0.5 overflow-hidden flex items-center justify-center font-bold text-xs text-indigo-400" style={{ backgroundColor: "var(--background)" }}>
                                {userPhoto ? (
                                    <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    getInitials(userName)
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-extrabold truncate block text-[var(--text-dark)] group-hover:text-indigo-400 transition-colors" title={userName}>
                                {userName || "Student"}
                            </span>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted)]">
                                <span className="truncate">Verified Student</span>
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            </div>
                        </div>
                    </Link>

                    <button
                        onClick={handleSignOut || (() => signOut(auth))}
                        className="p-2.5 rounded-xl transition-all cursor-pointer flex-shrink-0 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-rose-400 hover:border-rose-500/30 min-w-[42px] min-h-[42px] flex items-center justify-center"
                        title="Sign Out"
                        aria-label="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {/* Daily Streak Chip */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-amber-400 text-xs font-bold gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Flame className="w-4.5 h-4.5 fill-amber-400/20 text-amber-400 flex-shrink-0" />
                        <span className="truncate text-xs font-semibold text-[var(--text-dark)]">Study Streak</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 font-extrabold text-xs flex-shrink-0 border border-amber-400/20">
                        🔥 {userStreak} {userStreak === 1 ? 'Day' : 'Days'}
                    </span>
                </div>
            </div>

            {/* 2. Study Rooms Widget */}
            <div className="glass-card p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-4" style={{ backgroundColor: "var(--surface)" }}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Video className="w-4.5 h-4.5 text-indigo-400 flex-shrink-0" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dark)] truncate">Live Study Rooms</h3>
                    </div>
                    <Link href="/study" className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1 flex-shrink-0 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md">
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="space-y-2.5">
                    {loadingRooms ? (
                        <div className="space-y-2">
                            {[1, 2].map(i => (
                                <div key={i} className="h-14 rounded-xl skeleton-shimmer bg-[var(--surface-2)]" />
                            ))}
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center space-y-1.5">
                            <BookOpen className="w-5 h-5 text-indigo-400 mx-auto opacity-70" />
                            <p className="text-xs font-bold text-[var(--text-dark)]">No active rooms right now</p>
                            <p className="text-[11px] font-medium text-[var(--muted)]">Create a room & invite peers!</p>
                        </div>
                    ) : (
                        rooms.slice(0, 3).map((room) => (
                            <Link
                                key={room.id}
                                href={`/study?room=${room.id}`}
                                className="block p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] transition-all space-y-1 hover:border-indigo-500/30 focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs font-extrabold truncate text-[var(--text-dark)]">{room.topic}</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                                        Live
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-medium text-[var(--muted)] gap-2">
                                    <span className="truncate">Host: {room.hostName}</span>
                                    <span className="flex-shrink-0">{room.scheduleTime}</span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* 3. Quick Hub Navigation */}
            <div className="glass-card p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-3" style={{ backgroundColor: "var(--surface)" }}>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-purple-400 flex-shrink-0" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dark)]">Quick Hubs</h3>
                </div>
                <div className="space-y-1.5">
                    {quickLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-light)] hover:text-[var(--text-dark)] transition-all"
                        >
                            <span>{link.label}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {link.tag}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
}
