"use client";

import { useState, useEffect } from "react";
import { Plus, Sparkles } from "lucide-react";
import { StoryViewerModal } from "@/components/StoryViewerModal";
import { CreateStoryModal } from "@/components/CreateStoryModal";

interface StoryUser {
    id: string;
    name: string;
    avatar: string;
    hasUnseen: boolean;
    stories: { id: string; mediaUrl: string; caption?: string; timestamp: string }[];
}

interface StoriesBarProps {
    currentUser: any;
    getInitials: (name: string | null) => string;
}

export function StoriesBar({ currentUser, getInitials }: StoriesBarProps) {
    const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
    const [realStories, setRealStories] = useState<StoryUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
    const [myAvatar, setMyAvatar] = useState<string | null>(() => currentUser?.photoURL || null);

    const fetchMyAvatar = async () => {
        if (!currentUser?.uid) return;
        try {
            const res = await fetch(`/api/users/${currentUser.uid}?t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                if (data.avatarUrl) {
                    setMyAvatar(data.avatarUrl);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchStories = async () => {
        try {
            const res = await fetch(`/api/stories?t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setRealStories(data.stories || []);
            }
        } catch (e) {
            console.error("Error fetching real stories:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.uid) {
            setMyAvatar(currentUser.photoURL || null);
            fetchMyAvatar();
        }
        fetchStories();

        const handleProfileUpdate = (e: Event) => {
            const customEvt = e as CustomEvent;
            if (customEvt?.detail?.avatarUrl) {
                setMyAvatar(customEvt.detail.avatarUrl);
            }
            fetchMyAvatar();
            fetchStories();
        };

        window.addEventListener("userProfileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    }, [currentUser?.uid]);

    return (
        <>
            <div className="w-full overflow-x-auto no-scrollbar py-1">
                <div className="flex items-center gap-3.5 px-0.5">
                    
                    {/* Add Story Trigger */}
                    <div
                        onClick={() => setIsCreateStoryOpen(true)}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group active:scale-95 transition-all"
                    >
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-indigo-600 transition-transform group-hover:scale-105 shadow-md">
                            <div className="w-full h-full rounded-full bg-[var(--background)] p-0.5 overflow-hidden flex items-center justify-center">
                                {myAvatar || currentUser?.photoURL ? (
                                    <img src={myAvatar || currentUser.photoURL || ""} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-xs font-black text-[var(--text-dark)]">{getInitials(currentUser?.displayName || currentUser?.email)}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-[var(--background)]">
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <span className="text-[11px] font-medium text-[var(--text-dark)]">Your Story</span>
                    </div>

                    {/* Active User Stories List */}
                    {loading ? (
                        [1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full skeleton-shimmer bg-[var(--surface-2)]" />
                                <div className="w-10 h-2.5 rounded skeleton-shimmer bg-[var(--surface-2)]" />
                            </div>
                        ))
                    ) : realStories.length > 0 ? (
                        realStories.map((storyUser, idx) => (
                            <div
                                key={storyUser.id}
                                onClick={() => setActiveStoryIndex(idx)}
                                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group active:scale-95 transition-all"
                            >
                                <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 shadow-md ${
                                    storyUser.hasUnseen
                                        ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500"
                                        : "bg-[var(--border)]"
                                }`}>
                                    <div className="w-full h-full rounded-full bg-[var(--background)] p-0.5 overflow-hidden flex items-center justify-center">
                                        {storyUser.avatar ? (
                                            <img src={storyUser.avatar} alt={storyUser.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-black text-[var(--text-dark)]">{getInitials(storyUser.name)}</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[11px] font-medium text-[var(--text-dark)] truncate max-w-[66px]">
                                    {storyUser.name}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-[var(--surface)] border border-dashed border-[var(--border)] text-xs text-[var(--muted)] font-medium shadow-xs">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span>No active stories right now</span>
                        </div>
                    )}

                </div>
            </div>

            {/* Create Story Modal */}
            <CreateStoryModal
                isOpen={isCreateStoryOpen}
                onClose={() => setIsCreateStoryOpen(false)}
                currentUser={currentUser}
                onStoryCreated={fetchStories}
            />

            {/* Fullscreen Story Viewer Modal */}
            {activeStoryIndex !== null && realStories.length > 0 && (
                <StoryViewerModal
                    storyUsers={realStories}
                    initialIndex={activeStoryIndex}
                    onClose={() => setActiveStoryIndex(null)}
                />
            )}
        </>
    );
}
