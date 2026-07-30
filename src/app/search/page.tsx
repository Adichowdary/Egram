"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { UserCard } from "@/components/UserCard";
import { CreateMeetModal } from "@/components/CreateMeetModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { MobileNav } from "@/components/MobileNav";
import { Search as SearchIcon, Users, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/SplashScreen";
import { useRouter } from "next/navigation";

export default function SearchPage() {
    const [user, setUser] = useState<any>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(!(typeof window !== "undefined" && auth?.currentUser));
    const router = useRouter();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);

                try {
                    const res = await fetch(`/api/users/${currentUser.uid}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.following) {
                            setFollowingIds(new Set(data.following));
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch user following data:", error);
                }

                setLoading(false);
            } else {
                router.push("/login");
            }
        });

        return () => unsubscribeAuth();
    }, [router]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, user?.uid]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const queryTerm = searchQuery.trim();
        if (!queryTerm) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(queryTerm)}&uid=${user?.uid || ''}`);
            if (res.ok) {
                const users = await res.json();
                const mappedUsers = users.map((u: any) => ({
                    uid: u.firebaseUid,
                    ...u,
                    displayName: u.name || u.email?.split('@')[0] || "Learner",
                    photoURL: u.avatarUrl,
                    followersCount: u.followersCount || 0,
                    followingCount: u.followingCount || 0,
                    streak: u.currentStreak || 0
                }));
                setSearchResults(mappedUsers);
            }
        } catch (error: any) {
            console.error("Search error:", error);
            addToast("Failed to search users", "error");
        } finally {
            setIsSearching(false);
        }
    };

    const toggleFollow = async (targetUserId: string) => {
        if (!user) return;

        const isCurrentlyFollowing = followingIds.has(targetUserId);

        setFollowingIds(prev => {
            const next = new Set(prev);
            if (isCurrentlyFollowing) {
                next.delete(targetUserId);
            } else {
                next.add(targetUserId);
            }
            return next;
        });

        try {
            const res = await fetch(`/api/users/${targetUserId}/follow`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentUserId: user.uid }),
            });
            if (res.ok) {
                const data = await res.json();
                setFollowingIds(prev => {
                    const next = new Set(prev);
                    if (data.isFollowing) {
                        next.add(targetUserId);
                    } else {
                        next.delete(targetUserId);
                    }
                    return next;
                });
            } else {
                throw new Error("Failed to update follow status");
            }
        } catch {
            setFollowingIds(prev => {
                const next = new Set(prev);
                if (isCurrentlyFollowing) {
                    next.add(targetUserId);
                } else {
                    next.delete(targetUserId);
                }
                return next;
            });
            addToast("Failed to update follow status", "error");
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

    const hasQuery = searchQuery.trim().length > 0;

    return (
        <>
            <AnimatePresence>
                {loading && <SplashScreen key="splash" />}
            </AnimatePresence>

            {!loading && user && (
                <div className="min-h-screen bg-[var(--background)] text-[var(--text-dark)] pb-24 md:pb-8">
                    <Sidebar
                        user={user}
                        setIsModalOpen={setIsModalOpen}
                        setIsPostModalOpen={setIsPostModalOpen}
                        getInitials={getInitials}
                    />

                    <main className="main-content">
                        <div className="feed-column space-y-6">

                            {/* Header */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight">Discover Students & Creators</h1>
                                        <p className="text-xs text-[var(--text-light)] font-medium">
                                            Search learners, connect with study buddies, and follow learning journeys
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Search Form Bar */}
                            <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <form
                                    onSubmit={handleSearch}
                                    className="relative flex items-center rounded-2xl transition-all"
                                >
                                    <SearchIcon
                                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors z-10 ${
                                            isFocused ? "text-indigo-500" : "text-[var(--text-light)]"
                                        }`}
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsFocused(true)}
                                        onBlur={() => setIsFocused(false)}
                                        placeholder=""
                                        className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] focus:border-indigo-500 rounded-2xl py-3.5 pl-11 pr-20 text-xs sm:text-sm text-[var(--text-dark)] placeholder:text-[var(--text-light)] outline-none transition-all shadow-xs"
                                    />
                                    {isSearching ? (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                                            <Loader2 className="animate-spin w-4 h-4 text-indigo-500" />
                                        </div>
                                    ) : hasQuery ? (
                                        <button
                                            type="submit"
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black px-3.5 py-1.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all z-10 cursor-pointer shadow-sm"
                                        >
                                            Search
                                        </button>
                                    ) : null}
                                </form>
                            </motion.div>

                            {/* Results Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1 mb-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-[var(--text-light)]" />
                                        <span className="text-xs font-black uppercase tracking-wider text-[var(--text-light)]">
                                            {searchResults.length > 0 ? "Search Results" : "Suggested Learners"}
                                        </span>
                                    </div>
                                    {searchResults.length > 0 && (
                                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                                            {searchResults.length} found
                                        </span>
                                    )}
                                </div>

                                <AnimatePresence mode="wait">
                                    {searchResults.length > 0 ? (
                                        <motion.div
                                            key="results"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="space-y-3"
                                        >
                                            {searchResults.map((profile, index) => (
                                                <motion.div
                                                    key={profile.uid}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.04 }}
                                                >
                                                    <UserCard
                                                        profile={profile}
                                                        isFollowing={followingIds.has(profile.uid)}
                                                        onFollow={toggleFollow}
                                                    />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    ) : hasQuery && !isSearching ? (
                                        <motion.div
                                            key="no-results"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="glass-card p-8 text-center border border-dashed border-[var(--card-border)] rounded-3xl space-y-2"
                                        >
                                            <Users className="w-8 h-8 text-indigo-500 mx-auto opacity-60" />
                                            <p className="text-sm font-black text-[var(--text-dark)]">No learners found matching "{searchQuery}"</p>
                                            <p className="text-xs text-[var(--text-light)]">Try searching for another student's name or username!</p>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>

                        </div>

                        <RightSidebar
                            user={user}
                            handleSignOut={() => auth.signOut().then(() => router.push("/login"))}
                            getInitials={getInitials}
                        />
                    </main>

                    <MobileNav
                        onOpenCreatePost={() => setIsPostModalOpen(true)}
                        onOpenCreateMeet={() => setIsModalOpen(true)}
                        currentUserId={user.uid}
                    />

                    <CreateMeetModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        user={user}
                        getInitials={getInitials}
                    />

                    <CreatePostModal
                        isOpen={isPostModalOpen}
                        onClose={() => setIsPostModalOpen(false)}
                        user={user}
                    />
                </div>
            )}
        </>
    );
}
