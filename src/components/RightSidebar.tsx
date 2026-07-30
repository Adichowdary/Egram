"use client";

import { useEffect, useState } from "react";
import { User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogOut, Video, BookOpen, Flame, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRooms } from "@/hooks/useRooms";

interface RightSidebarProps {
    user: User;
    handleSignOut?: () => void;
    getInitials: (name: string | null) => string;
}

export function RightSidebar({ user, handleSignOut, getInitials }: RightSidebarProps) {
    const { rooms, loading: loadingRooms } = useRooms();

    const [userPhoto, setUserPhoto] = useState<string | null>(user?.photoURL || null);
    const [userName, setUserName] = useState<string>(user?.displayName || user?.email?.split('@')[0] || "Learner");
    const [userStreak, setUserStreak] = useState<number>(0);

    const fetchRightSidebarUser = async () => {
        if (!user?.uid) return;
        try {
            const res = await fetch(`/api/users/${user.uid}?t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                if (data.avatarUrl) setUserPhoto(data.avatarUrl);
                if (data.name) setUserName(data.name);
                setUserStreak(data.currentStreak || data.streak || 0);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchRightSidebarUser();

        const handleUpdate = (e: Event) => {
            const customEvt = e as CustomEvent;
            if (customEvt?.detail?.avatarUrl) setUserPhoto(customEvt.detail.avatarUrl);
            if (customEvt?.detail?.name) setUserName(customEvt.detail.name);
            fetchRightSidebarUser();
        };

        window.addEventListener("userProfileUpdated", handleUpdate);
        return () => window.removeEventListener("userProfileUpdated", handleUpdate);
    }, [user?.uid]);

    return (
        <aside className="right-sidebar space-y-6">
            {/* 1. Mini Profile Card Widget */}
            <div className="bg-[#1e1e1e] p-4 sm:p-5 border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-lg relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <Link href={`/profile/${user.uid}`} className="flex items-center gap-3 group min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-purple-500 shadow-sm flex-shrink-0">
                            <div className="w-full h-full rounded-full bg-[#121212] p-0.5 overflow-hidden flex items-center justify-center font-bold text-sm text-blue-400">
                                {userPhoto ? (
                                    <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    getInitials(userName)
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate block">
                                {userName}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-[#a0a0a0] font-medium">
                                <span className="truncate">Verified Learner</span>
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                            </div>
                        </div>
                    </Link>

                    <button
                        onClick={handleSignOut || (() => signOut(auth))}
                        className="p-2 rounded-xl bg-[#242424] hover:bg-rose-500/10 text-[#a0a0a0] hover:text-rose-400 transition-all cursor-pointer flex-shrink-0 border border-[rgba(255,255,255,0.08)]"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>

                {/* Daily Streak Chip */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#242424] border border-amber-500/20 text-amber-400 text-xs font-bold gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Flame className="w-4 h-4 fill-amber-400 animate-pulse flex-shrink-0" />
                        <span className="truncate">Daily Study Streak</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] flex-shrink-0 border border-amber-500/30">
                        {userStreak} {userStreak === 1 ? 'Day' : 'Days'}
                    </span>
                </div>
            </div>

            {/* 2. Study Rooms Widget */}
            <div className="bg-[#1e1e1e] p-4 sm:p-5 border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-lg space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white truncate">Live Study Rooms</h3>
                    </div>
                    <Link href="/study" className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1 flex-shrink-0">
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="space-y-3">
                    {loadingRooms ? (
                        <div className="space-y-2">
                            {[1, 2].map(i => (
                                <div key={i} className="h-16 rounded-xl bg-[#242424] skeleton-shimmer" />
                            ))}
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="p-4 rounded-xl bg-[#242424] border border-dashed border-[rgba(255,255,255,0.08)] text-center space-y-2">
                            <BookOpen className="w-6 h-6 text-blue-400 mx-auto opacity-70" />
                            <p className="text-xs font-bold text-white">No active rooms right now</p>
                            <p className="text-[11px] text-[#a0a0a0] font-medium">Create a room & invite friends!</p>
                        </div>
                    ) : (
                        rooms.slice(0, 3).map((room) => (
                            <div
                                key={room.id}
                                className="p-3 rounded-xl bg-[#242424] border border-[rgba(255,255,255,0.08)] hover:border-blue-500/40 transition-all space-y-1.5"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="text-xs font-bold text-white truncate">{room.topic}</h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                                        Live
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-[#a0a0a0] font-medium gap-2">
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
