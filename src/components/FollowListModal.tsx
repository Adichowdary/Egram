"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, UserCheck, Users } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export interface ListUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    bio?: string;
    followersCount: number;
    followingCount: number;
    streak?: number;
    isFollowing: boolean;
}

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string;
    targetUserName?: string;
    currentUserId: string | null;
    initialTab?: "followers" | "following";
    onFollowChange?: () => void;
}

export function FollowListModal({
    isOpen,
    onClose,
    targetUserId,
    targetUserName = "User",
    currentUserId,
    initialTab = "followers",
    onFollowChange
}: FollowListModalProps) {
    const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
    const [usersList, setUsersList] = useState<ListUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setSearchQuery("");
        }
    }, [isOpen, initialTab]);

    const fetchList = async () => {
        if (!isOpen || !targetUserId) return;
        setLoading(true);
        try {
            const endpoint = activeTab === "followers"
                ? `/api/users/${targetUserId}/followers?currentUserId=${currentUserId || ""}`
                : `/api/users/${targetUserId}/following?currentUserId=${currentUserId || ""}`;

            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                const items = activeTab === "followers" ? data.followers : data.following;
                setUsersList(items || []);
            } else {
                setUsersList([]);
            }
        } catch (err) {
            console.error("Error fetching list:", err);
            setUsersList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [isOpen, targetUserId, activeTab, currentUserId]);

    const handleToggleFollow = async (listUser: ListUser) => {
        if (!currentUserId) {
            router.push(`/login?redirect=/profile/${targetUserId}`);
            return;
        }

        const isFollowingTarget = listUser.isFollowing;
        const newStatus = !isFollowingTarget;

        // Optimistic state update for immediate feedback
        setUsersList(prev => prev.map(u => {
            if (u.uid === listUser.uid) {
                return {
                    ...u,
                    isFollowing: newStatus,
                    followersCount: u.followersCount + (newStatus ? 1 : -1)
                };
            }
            return u;
        }));

        try {
            const res = await fetch(`/api/users/${listUser.uid}/follow`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followerId: currentUserId })
            });

            if (res.ok) {
                const data = await res.json();
                addToast(data.isFollowing ? `Following ${listUser.displayName}` : `Unfollowed ${listUser.displayName}`, "success");
                if (onFollowChange) onFollowChange();
            } else {
                // Revert optimistic update on failure
                setUsersList(prev => prev.map(u => u.uid === listUser.uid ? { ...u, isFollowing: isFollowingTarget } : u));
                addToast("Action failed", "error");
            }
        } catch (err) {
            setUsersList(prev => prev.map(u => u.uid === listUser.uid ? { ...u, isFollowing: isFollowingTarget } : u));
            addToast("Action failed", "error");
        }
    };

    const filteredUsers = usersList.filter(u =>
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.bio && u.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getInitials = (name: string) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

    const handleNavigate = (uid: string) => {
        onClose();
        router.push(`/profile/${uid}`);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="w-full max-w-md bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[var(--primary)]" />
                            <h2 className="text-base font-black tracking-tight text-[var(--text-dark)]">
                                {targetUserName}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-zinc-400 hover:text-[var(--text-dark)] hover:bg-zinc-800/40 transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="grid grid-cols-2 p-1.5 bg-[var(--accent-bg)] border-b border-[var(--card-border)]">
                        <button
                            onClick={() => setActiveTab("followers")}
                            className={`py-2.5 text-xs font-black rounded-2xl transition-all ${
                                activeTab === "followers"
                                    ? "bg-[var(--card-bg)] text-[var(--primary)] shadow-md"
                                    : "text-[var(--text-light)] hover:text-[var(--text-dark)]"
                            }`}
                        >
                            Followers
                        </button>
                        <button
                            onClick={() => setActiveTab("following")}
                            className={`py-2.5 text-xs font-black rounded-2xl transition-all ${
                                activeTab === "following"
                                    ? "bg-[var(--card-bg)] text-[var(--primary)] shadow-md"
                                    : "text-[var(--text-light)] hover:text-[var(--text-dark)]"
                            }`}
                        >
                            Following
                        </button>
                    </div>

                    {/* Search input */}
                    <div className="p-3 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                        <div className="relative flex items-center">
                            <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 pointer-events-none z-10 opacity-60" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${activeTab}...`}
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] text-[var(--text-dark)] text-xs rounded-xl pl-10 pr-8 py-2.5 focus:outline-none focus:border-[var(--primary)] font-medium placeholder:text-[var(--text-light)] placeholder:opacity-60 placeholder:font-normal truncate"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 text-xs text-zinc-400 hover:text-white"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {loading ? (
                            <div className="space-y-3 p-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-12 h-12 rounded-full bg-[var(--accent-bg)]" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 bg-[var(--accent-bg)] rounded w-1/3" />
                                            <div className="h-2.5 bg-[var(--accent-bg)] rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12 px-4 space-y-2">
                                <Users className="w-10 h-10 mx-auto text-zinc-500 opacity-40" />
                                <p className="text-sm font-bold text-[var(--text-dark)]">
                                    {searchQuery
                                        ? "No matching users found"
                                        : activeTab === "followers"
                                        ? "No followers yet."
                                        : "Not following anyone yet."}
                                </p>
                                <p className="text-xs text-[var(--text-light)]">
                                    {activeTab === "followers"
                                        ? "When people follow this profile, they will appear here."
                                        : "Profiles followed by this user will be listed here."}
                                </p>
                            </div>
                        ) : (
                            filteredUsers.map(listUser => {
                                const isSelf = currentUserId === listUser.uid;
                                return (
                                    <div
                                        key={listUser.uid}
                                        className="flex items-center justify-between p-2.5 rounded-2xl border border-transparent hover:border-[var(--card-border)] hover:bg-[var(--accent-bg)]/50 transition-all cursor-pointer group"
                                        onClick={() => handleNavigate(listUser.uid)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 p-0.5 flex-shrink-0">
                                                <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden flex items-center justify-center border border-[var(--card-border)]">
                                                    {listUser.photoURL ? (
                                                        <img src={listUser.photoURL} alt={listUser.displayName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-black text-white">
                                                            {getInitials(listUser.displayName)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-black text-[var(--text-dark)] truncate leading-snug group-hover:text-[var(--primary)] transition-colors">
                                                    {listUser.displayName}
                                                </span>
                                                {listUser.bio ? (
                                                    <span className="text-xs text-[var(--text-light)] truncate">
                                                        {listUser.bio}
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-[var(--text-light)]">
                                                        {listUser.followersCount} followers
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!isSelf && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleFollow(listUser);
                                                }}
                                                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all flex-shrink-0 active:scale-95 ${
                                                    listUser.isFollowing
                                                        ? "bg-[var(--accent-bg)] text-zinc-400 border border-[var(--card-border)] hover:bg-zinc-800"
                                                        : "bg-[var(--primary)] text-white hover:opacity-90 shadow-md shadow-purple-500/20"
                                                }`}
                                            >
                                                {listUser.isFollowing ? (
                                                    <><UserCheck className="w-3.5 h-3.5" /> Following</>
                                                ) : (
                                                    <><UserPlus className="w-3.5 h-3.5" /> Follow</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
