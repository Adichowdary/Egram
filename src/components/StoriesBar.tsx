"use client";

import { useState, useEffect } from "react";
import { Plus, Camera, Sparkles } from "lucide-react";
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
            <div className="w-full overflow-x-auto no-scrollbar py-2">
                <div className="flex items-center gap-4 px-1">
                    
                    {/* Add Story Trigger */}
                    <div
                        onClick={() => setIsCreateStoryOpen(true)}
                        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group active:scale-95 transition-all"
                    >
                        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 transition-transform group-hover:scale-105 shadow-md">
                            <div className="w-full h-full rounded-full bg-[var(--background)] p-0.5 overflow-hidden flex items-center justify-center">
                                {myAvatar || currentUser?.photoURL ? (
                                    <img src={myAvatar || currentUser.photoURL || ""} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="text-sm font-black text-[var(--text-dark)]">{getInitials(currentUser?.displayName || currentUser?.email)}</span>
                                )}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-[var(--background)]">
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <span className="text-[11px] font-bold text-[var(--text-dark)]">Your Story</span>
                    </div>

                    {/* Active User Stories List */}
                    {realStories.length > 0 ? (
                        realStories.map((storyUser, idx) => (
                            <div
                                key={storyUser.id}
                                onClick={() => setActiveStoryIndex(idx)}
                                className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group active:scale-95 transition-all"
                            >
                                <div className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-full p-[2.5px] transition-transform group-hover:scale-105 shadow-md ${
                                    storyUser.hasUnseen
                                        ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 animate-pulse"
                                        : "bg-slate-300 dark:bg-slate-700"
                                }`}>
                                    <div className="w-full h-full rounded-full bg-[var(--background)] p-0.5 overflow-hidden flex items-center justify-center">
                                        {storyUser.avatar ? (
                                            <img src={storyUser.avatar} alt={storyUser.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-black text-[var(--text-dark)]">{getInitials(storyUser.name)}</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[11px] font-bold text-[var(--text-dark)] truncate max-w-[70px]">
                                    {storyUser.name}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--card-bg)] border border-dashed border-[var(--card-border)] text-xs text-[var(--text-light)] font-bold shadow-xs">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>No active status stories right now</span>
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
