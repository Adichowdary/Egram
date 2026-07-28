import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { PostFeed } from "./PostFeed";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import Link from "next/link";

interface CenterFeedProps {
    user: User;
}

interface OnlineUser {
    uid: string;
    displayName: string;
    photoURL: string;
    currentStreak: number;
    isOnline: boolean;
    lastActive: any;
}

import { StoriesBar } from "./StoriesBar";

export function CenterFeed({ user }: CenterFeedProps) {
    const [feedType, setFeedType] = useState<"global" | "following">("global");
    const [streakLeaderboard, setStreakLeaderboard] = useState<any[]>([]);
    const [onlineUids, setOnlineUids] = useState<Set<string>>(new Set());
    const [loadingStreak, setLoadingStreak] = useState(true);

    const fetchGlobalStreakLeaderboard = async () => {
        try {
            const res = await fetch(`/api/users?sort=streak&t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                const users = data.data || [];
                
                // Sort by highest streak descending
                users.sort((a: any, b: any) => {
                    const strA = a.currentStreak || a.streak || 0;
                    const strB = b.currentStreak || b.streak || 0;
                    return strB - strA;
                });

                setStreakLeaderboard(users);
            }
        } catch (error) {
            console.error("Error fetching streak leaderboard:", error);
        } finally {
            setLoadingStreak(false);
        }
    };

    useEffect(() => {
        fetchGlobalStreakLeaderboard();

        // Firestore online presence listener
        const usersQuery = query(collection(db, "users"), where("isOnline", "==", true));
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const onlineSet = new Set<string>();
            snapshot.docs.forEach(doc => onlineSet.add(doc.id));
            setOnlineUids(onlineSet);
        });

        const handleProfileUpdate = () => fetchGlobalStreakLeaderboard();
        window.addEventListener("userProfileUpdated", handleProfileUpdate);

        return () => {
            unsubscribe();
            window.removeEventListener("userProfileUpdated", handleProfileUpdate);
        };
    }, [user?.uid]);

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="feed-column">
            {/* Egram 2.0 24h Stories Bar */}
            <div className="mb-4">
                <StoriesBar currentUser={user} getInitials={getInitials} />
            </div>

            {/* Global Streak Leaderboard Bar */}
            <div className="glass rounded-3xl p-4 sm:p-5 mb-6 border border-zinc-800/90 bg-zinc-950/80 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg">🔥</span>
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">Global Streak Leaderboard</h3>
                    </div>
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">Top Users</span>
                </div>

                <div className="overflow-x-auto no-scrollbar py-2">
                    <div className="flex items-center gap-5 min-w-max px-1">
                        {loadingStreak ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse border-2 border-zinc-700" />
                            ))
                        ) : streakLeaderboard.length > 0 ? (
                            streakLeaderboard.map((item, index) => {
                                const rank = index + 1;
                                const isSelf = item.firebaseUid === user.uid;
                                const isOnline = onlineUids.has(item.firebaseUid);
                                const streakVal = item.currentStreak || item.streak || 0;

                                let borderGradient = "bg-gradient-to-tr from-cyan-400 to-blue-500";
                                let crownBadge = null;

                                if (rank === 1) {
                                    borderGradient = "bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600 shadow-amber-500/50";
                                    crownBadge = "👑 #1";
                                } else if (rank === 2) {
                                    borderGradient = "bg-gradient-to-tr from-slate-200 via-slate-400 to-zinc-400 shadow-slate-400/40";
                                    crownBadge = "🥈 #2";
                                } else if (rank === 3) {
                                    borderGradient = "bg-gradient-to-tr from-amber-700 via-orange-600 to-amber-800 shadow-amber-700/40";
                                    crownBadge = "🥉 #3";
                                }

                                return (
                                    <Link key={item.firebaseUid || index} href={`/profile/${item.firebaseUid}`} className="relative group flex flex-col items-center gap-1.5">
                                        
                                        {/* Rank Crown Badge */}
                                        {crownBadge && (
                                            <div className="absolute -top-3.5 z-30 bg-zinc-950 border border-amber-500/60 px-2 py-0.5 rounded-full text-[9px] font-black text-amber-400 shadow-lg">
                                                {crownBadge}
                                            </div>
                                        )}

                                        {/* Ring and Avatar Wrapper */}
                                        <div className="relative">
                                            <div className={`w-16 h-16 rounded-full p-[2px] transition-all duration-300 group-hover:scale-105 shadow-xl ${borderGradient}`}>
                                                <div className="w-full h-full rounded-full bg-zinc-950 p-[2px]">
                                                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-zinc-900">
                                                        {item.avatarUrl ? (
                                                            <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                        ) : (
                                                            <span className="text-lg font-black text-blue-400">{getInitials(item.name)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Online indicator */}
                                            {isOnline && (
                                                <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-green-500 border-[3px] border-zinc-950 rounded-full z-20 shadow-md" />
                                            )}

                                            {/* Streak Badge */}
                                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-lg z-20">
                                                <span className="text-[10px] font-black text-white">{streakVal}</span>
                                                <span className="text-[10px]">{streakVal > 10 ? '🔥' : '❄️'}</span>
                                            </div>
                                        </div>
                                        
                                        <span className="text-[10px] font-bold text-zinc-300 max-w-[68px] truncate transition-colors group-hover:text-white mt-1">
                                            {isSelf ? 'You' : (item.name || 'User')}
                                        </span>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                                <span className="text-xs font-bold text-zinc-400">No active streak records yet</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-6 px-1 border-b border-zinc-800/30">
                <button
                    onClick={() => setFeedType("global")}
                    className={`relative pb-3 px-4 transition-colors ${feedType === "global" ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Explore
                    {feedType === "global" && (
                        <motion.div 
                            layoutId="activeTab" 
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] shadow-[0_0_10px_rgba(0,149,246,0.5)]" 
                        />
                    )}
                </button>
                <button
                    onClick={() => setFeedType("following")}
                    className={`relative pb-3 px-4 transition-colors ${feedType === "following" ? "text-white font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                    Following
                    {feedType === "following" && (
                        <motion.div 
                            layoutId="activeTab" 
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)] shadow-[0_0_10px_rgba(0,149,246,0.5)]" 
                        />
                    )}
                </button>
            </div>

            <PostFeed user={user} feedType={feedType} />
        </div>
    );
}
