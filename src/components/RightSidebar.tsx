"use client";

import { User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogOut, Video, BookOpen, Flame, ArrowRight, ShieldCheck } from "lucide-react";
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

    return (
        <aside className="right-sidebar space-y-5">
            {/* 1. Mini Profile Card Widget */}
            <div className="glass-card p-4 sm:p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-3.5" style={{ backgroundColor: "var(--surface)" }}>
                <div className="flex items-center justify-between gap-3">
                    <Link href={`/profile/${user.uid}`} className="flex items-center gap-3 group min-w-0 flex-1">
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
                                {userName}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-medium text-[var(--muted)]">
                                <span className="truncate">Verified Learner</span>
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            </div>
                        </div>
                    </Link>

                    <button
                        onClick={handleSignOut || (() => signOut(auth))}
                        className="p-2 rounded-xl transition-all cursor-pointer flex-shrink-0 border border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-rose-400 hover:border-rose-500/30"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {/* Daily Streak Chip */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-amber-400 text-xs font-bold gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Flame className="w-4 h-4 fill-amber-400/20 flex-shrink-0" />
                        <span className="truncate">Daily Study Streak</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-extrabold text-[11px] flex-shrink-0 border border-amber-400/20">
                        🔥 {userStreak} {userStreak === 1 ? 'Day' : 'Days'}
                    </span>
                </div>
            </div>

            {/* 2. Study Rooms Widget */}
            <div className="glass-card p-4 sm:p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-3.5" style={{ backgroundColor: "var(--surface)" }}>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Video className="w-4.5 h-4.5 text-indigo-400 flex-shrink-0" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-dark)] truncate">Live Study Rooms</h3>
                    </div>
                    <Link href="/study" className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1 flex-shrink-0">
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
                            <p className="text-[11px] font-medium text-[var(--muted)]">Create a room & invite friends!</p>
                        </div>
                    ) : (
                        rooms.slice(0, 3).map((room) => (
                            <div
                                key={room.id}
                                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] transition-all space-y-1 hover:border-indigo-500/30"
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
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
