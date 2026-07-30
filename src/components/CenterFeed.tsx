import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { PostFeed } from "./PostFeed";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import Link from "next/link";
import { StoriesBar } from "./StoriesBar";
import { Flame, Compass, Users, Image as ImageIcon, Video, Sparkles, TrendingUp } from "lucide-react";
import { CreatePostModal } from "./CreatePostModal";
import { CreateMeetModal } from "./CreateMeetModal";

interface CenterFeedProps {
    user: User;
}

export function CenterFeed({ user }: CenterFeedProps) {
    const [feedType, setFeedType] = useState<"global" | "following">("global");
    const [streakLeaderboard, setStreakLeaderboard] = useState<any[]>([]);
    const [onlineUids, setOnlineUids] = useState<Set<string>>(new Set());
    const [loadingStreak, setLoadingStreak] = useState(true);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isMeetModalOpen, setIsMeetModalOpen] = useState(false);

    const trendingTags = ["#MachineLearning", "#WebDev", "#SystemDesign", "#Calculus", "#CyberSecurity"];

    const fetchGlobalStreakLeaderboard = async () => {
        try {
            const res = await fetch(`/api/users?sort=streak&t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                const users = data.data || [];
                
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
        <div className="feed-column space-y-6">
            {/* 1. 24h Stories Bar Widget */}
            <StoriesBar currentUser={user} getInitials={getInitials} />

            {/* 2. Quick Post Composer Widget */}
            <div className="glass-card p-4 sm:p-5 border rounded-2xl shadow-md space-y-4" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-blue-500/40 p-0.5 flex-shrink-0">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center font-bold text-sm">
                                {getInitials(user.displayName || user.email)}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex-1 border text-left px-4 py-3 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer truncate"
                        style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)", color: "var(--text-light)" }}
                    >
                        Share a study update, code snippet, or thought...
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t text-xs font-bold" style={{ borderColor: "var(--card-border)", color: "var(--text-light)" }}>
                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all cursor-pointer truncate"
                        style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}
                    >
                        <ImageIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="truncate">Add Media</span>
                    </button>

                    <button
                        onClick={() => setIsMeetModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all cursor-pointer truncate"
                        style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}
                    >
                        <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="truncate">Study Room</span>
                    </button>

                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 shadow-md transition-all cursor-pointer truncate"
                    >
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Publish</span>
                    </button>
                </div>
            </div>

            {/* 3. Global Streak Leaderboard Widget - 84px Column Slot Sizing */}
            <div className="glass-card p-4 sm:p-5 border rounded-2xl shadow-md space-y-3" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse flex-shrink-0" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-dark)" }}>Global Streak Hall of Fame</h3>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex-shrink-0">
                        Top Streaks
                    </span>
                </div>

                <div className="overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center gap-4 min-w-max px-1">
                        {loadingStreak ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-20 h-20 rounded-xl skeleton-shimmer" style={{ backgroundColor: "var(--accent-bg)" }} />
                            ))
                        ) : streakLeaderboard.length > 0 ? (
                            streakLeaderboard.slice(0, 10).map((item, index) => {
                                const rank = index + 1;
                                const isSelf = item.firebaseUid === user.uid;
                                const isOnline = onlineUids.has(item.firebaseUid);
                                const streakVal = item.currentStreak || item.streak || 0;

                                let borderGradient = "border-blue-500/40";
                                let rankTag = null;

                                if (rank === 1) {
                                    borderGradient = "border-amber-500 shadow-amber-500/20";
                                    rankTag = "👑 #1";
                                } else if (rank === 2) {
                                    borderGradient = "border-slate-400";
                                    rankTag = "🥈 #2";
                                } else if (rank === 3) {
                                    borderGradient = "border-amber-600";
                                    rankTag = "🥉 #3";
                                }

                                return (
                                    <Link key={item.firebaseUid || index} href={`/profile/${item.firebaseUid}`} className="relative group flex flex-col items-center gap-1.5 min-w-[84px] max-w-[88px]">
                                        <div className="relative">
                                            <div className={`w-13 h-13 rounded-full border-2 p-0.5 transition-all group-hover:scale-105 shadow-sm ${borderGradient}`}>
                                                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-xs" style={{ backgroundColor: "var(--accent-bg)", color: "var(--primary)" }}>
                                                    {item.avatarUrl ? (
                                                        <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{getInitials(item.name)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {isOnline && (
                                                <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 rounded-full z-20" style={{ borderColor: "var(--card-bg)" }} />
                                            )}
                                        </div>

                                        {/* Clean Streak Badge below avatar */}
                                        <div className="px-2 py-0.5 rounded-full border text-[10px] font-bold text-amber-500 shadow-sm flex items-center gap-0.5" style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}>
                                            <span>{streakVal}d</span>
                                            {rankTag && <span className="ml-0.5">{rankTag}</span>}
                                        </div>
                                        
                                        <span className="text-[11px] font-medium w-full text-center truncate px-0.5" style={{ color: "var(--text-dark)" }}>
                                            {isSelf ? 'You' : (item.name || 'User')}
                                        </span>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ backgroundColor: "var(--accent-bg)", color: "var(--text-light)" }}>
                                <span>No active streak records yet</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Trending Topics Bar Widget */}
            <div className="glass-card p-3.5 border rounded-xl flex items-center justify-between gap-3 overflow-x-auto no-scrollbar" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase" style={{ color: "var(--text-light)" }}>Trending Topics:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {trendingTags.map((tag) => (
                        <Link key={tag} href={`/search?q=${encodeURIComponent(tag.replace('#', ''))}`} className="px-2.5 py-1 rounded-lg border text-xs font-bold text-blue-500 transition-all flex-shrink-0" style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}>
                            {tag}
                        </Link>
                    ))}
                </div>
            </div>

            {/* 5. Compact Feed Switcher Widget */}
            <div className="flex justify-center my-2">
                <div className="inline-flex items-center gap-1.5 p-1 border rounded-full shadow-md" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                    <button
                        onClick={() => setFeedType("global")}
                        className={`py-2 px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            feedType === "global"
                                ? "bg-blue-500 text-white shadow-sm"
                                : ""
                        }`}
                        style={{ color: feedType === "global" ? "#ffffff" : "var(--text-light)" }}
                    >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Explore Feed</span>
                    </button>

                    <button
                        onClick={() => setFeedType("following")}
                        className={`py-2 px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            feedType === "following"
                                ? "bg-blue-500 text-white shadow-sm"
                                : ""
                        }`}
                        style={{ color: feedType === "following" ? "#ffffff" : "var(--text-light)" }}
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>Following</span>
                    </button>
                </div>
            </div>

            {/* 6. Post Feed */}
            <PostFeed user={user} feedType={feedType} />

            {/* Modals */}
            <CreatePostModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                user={user}
            />

            <CreateMeetModal
                isOpen={isMeetModalOpen}
                onClose={() => setIsMeetModalOpen(false)}
                user={user}
                getInitials={getInitials}
            />
        </div>
    );
}
