import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { PostFeed } from "./PostFeed";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { StoriesBar } from "./StoriesBar";
import { Flame, Compass, Users, Image as ImageIcon, Video, Sparkles, TrendingUp } from "lucide-react";
import { CreatePostModal } from "./CreatePostModal";
import { CreateMeetModal } from "./CreateMeetModal";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion } from "framer-motion";

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

    const { userPhoto, userName } = useUserProfile(user);

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
            <div className="glass-card p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-4" style={{ backgroundColor: "var(--surface)" }}>
                <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-indigo-500/30 p-0.5 flex-shrink-0">
                        {userPhoto ? (
                            <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs">
                                {getInitials(userName)}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex-1 border border-[var(--border)] text-left px-5 py-3 rounded-full text-sm font-medium transition-all cursor-pointer truncate min-h-[46px] hover:border-indigo-500/30 focus-visible:ring-2 focus-visible:ring-indigo-500"
                        style={{ backgroundColor: "var(--surface-2)", color: "var(--muted)" }}
                    >
                        Share an update, doubt, or study resource…
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border)] text-xs font-semibold" style={{ color: "var(--muted)" }}>
                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[var(--border)] transition-all cursor-pointer truncate min-h-[42px] hover:border-indigo-500/30 hover:text-[var(--text-dark)] focus-visible:ring-2 focus-visible:ring-indigo-500"
                        style={{ backgroundColor: "var(--surface-2)" }}
                    >
                        <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">Media</span>
                    </button>

                    <button
                        onClick={() => setIsMeetModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[var(--border)] transition-all cursor-pointer truncate min-h-[42px] hover:border-indigo-500/30 hover:text-[var(--text-dark)] focus-visible:ring-2 focus-visible:ring-indigo-500"
                        style={{ backgroundColor: "var(--surface-2)" }}
                    >
                        <Video className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">Live Room</span>
                    </button>

                    <button
                        onClick={() => setIsPostModalOpen(true)}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm transition-all cursor-pointer truncate min-h-[42px] focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <Sparkles className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">Post</span>
                    </button>
                </div>
            </div>

            {/* 3. Global Streak Leaderboard Widget */}
            <div className="glass-card p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-4" style={{ backgroundColor: "var(--surface)" }}>
                <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-2.5">
                        <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20 flex-shrink-0" />
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--text-dark)]">Streak Hall of Fame</h3>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full flex-shrink-0">
                        Top Streaks
                    </span>
                </div>

                <div className="overflow-x-auto no-scrollbar py-1">
                    <div className="flex items-center gap-4 min-w-max px-0.5">
                        {loadingStreak ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-20 h-24 rounded-2xl skeleton-shimmer bg-[var(--surface-2)]" />
                            ))
                        ) : streakLeaderboard.length > 0 ? (
                            streakLeaderboard.slice(0, 10).map((item, index) => {
                                const rank = index + 1;
                                const isSelf = item.firebaseUid === user.uid;
                                const isOnline = onlineUids.has(item.firebaseUid);
                                const streakVal = item.currentStreak || item.streak || 0;

                                let borderGradient = "border-[var(--border)]";
                                let rankTag = null;

                                if (rank === 1) {
                                    borderGradient = "border-amber-400 ring-2 ring-amber-400/20";
                                    rankTag = "👑 #1";
                                } else if (rank === 2) {
                                    borderGradient = "border-slate-300 ring-2 ring-slate-300/20";
                                    rankTag = "🥈 #2";
                                } else if (rank === 3) {
                                    borderGradient = "border-amber-600 ring-2 ring-amber-600/20";
                                    rankTag = "🥉 #3";
                                }

                                return (
                                    <Link key={item.firebaseUid || index} href={`/profile/${item.firebaseUid}`} className="relative group flex flex-col items-center gap-2 min-w-[84px] max-w-[92px] focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl p-1">
                                        <div className="relative">
                                            <div className={`w-12 h-12 rounded-full border-2 p-0.5 transition-all group-hover:scale-105 shadow-sm ${borderGradient}`}>
                                                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-xs bg-[var(--surface-2)] text-indigo-400">
                                                    {item.avatarUrl ? (
                                                        <img src={item.avatarUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{getInitials(item.name)}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {isOnline && (
                                                <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[var(--surface)] rounded-full z-20" />
                                            )}
                                        </div>

                                        {/* Clean Streak Badge below avatar */}
                                        <div className="px-2.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[10px] font-bold text-amber-400 shadow-xs flex items-center gap-1">
                                            <span>🔥 {streakVal}d</span>
                                            {rankTag && <span className="ml-0.5 text-[9px]">{rankTag}</span>}
                                        </div>
                                        
                                        <span className="text-xs font-semibold w-full text-center truncate px-0.5 text-[var(--text-dark)]">
                                            {isSelf ? 'You' : (item.name || 'User')}
                                        </span>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs bg-[var(--surface-2)] text-[var(--muted)]">
                                <span>No active streak records yet</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Trending Topics Bar Widget */}
            <div className="glass-card p-4 border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3 overflow-x-auto no-scrollbar" style={{ backgroundColor: "var(--surface)" }}>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Trending Topics:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {trendingTags.map((tag) => (
                        <Link 
                            key={tag} 
                            href={`/search?q=${encodeURIComponent(tag.replace('#', ''))}`} 
                            className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-indigo-400 hover:border-indigo-500/30 transition-all flex-shrink-0"
                        >
                            {tag}
                        </Link>
                    ))}
                </div>
            </div>

            {/* 5. Stream Filter Tabs */}
            <div className="flex justify-center my-1">
                <div className="inline-flex items-center gap-1 p-1 border border-[var(--border)] rounded-full shadow-sm" style={{ backgroundColor: "var(--surface)" }}>
                    <button
                        onClick={() => setFeedType("global")}
                        className={`py-2 px-5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[40px] ${
                            feedType === "global"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-[var(--muted)] hover:text-[var(--text-dark)]"
                        }`}
                    >
                        <Compass className="w-4 h-4" />
                        <span>Explore Feed</span>
                    </button>

                    <button
                        onClick={() => setFeedType("following")}
                        className={`py-2 px-5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer min-h-[40px] ${
                            feedType === "following"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "text-[var(--muted)] hover:text-[var(--text-dark)]"
                        }`}
                    >
                        <Users className="w-4 h-4" />
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
