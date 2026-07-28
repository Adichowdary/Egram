"use client";

import { useState, useEffect } from "react";
import { Plus, Camera } from "lucide-react";
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
            <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                <div className="flex items-center gap-4 px-1">
                    
                    {/* Add Story Button */}
                    <div
                        onClick={() => setIsCreateStoryOpen(true)}
                        className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group active:scale-95 transition-transform"
                    >
                        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-zinc-900 border-2 border-dashed border-purple-500/70 flex items-center justify-center relative group-hover:scale-105 transition-transform shadow-lg">
                            {myAvatar || currentUser?.photoURL ? (
                                <img src={myAvatar || currentUser.photoURL || ""} alt="Avatar" className="w-full h-full rounded-full object-cover p-0.5" />
                            ) : (
                                <span className="text-base font-black text-white">{getInitials(currentUser?.displayName || currentUser?.email)}</span>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-lg border-2 border-zinc-900">
                                <Plus className="w-4 h-4" />
                            </div>
                        </div>
                        <span className="text-xs font-extrabold text-zinc-300 group-hover:text-white">Your Story</span>
                    </div>

                    {/* Real Active User Stories */}
                    {realStories.length > 0 ? (
                        realStories.map((storyUser, idx) => (
                            <div
                                key={storyUser.id}
                                onClick={() => setActiveStoryIndex(idx)}
                                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group active:scale-95 transition-transform"
                            >
                                <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full p-0.5 relative transition-transform group-hover:scale-105 shadow-md ${
                                    storyUser.hasUnseen
                                        ? "bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600"
                                        : "bg-zinc-700"
                                }`}>
                                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center border-2 border-zinc-900 overflow-hidden">
                                        {storyUser.avatar ? (
                                            <img src={storyUser.avatar} alt={storyUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-black text-white">{getInitials(storyUser.name)}</span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-zinc-300 truncate max-w-[72px]">
                                    {storyUser.name}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[var(--accent-bg)] border border-dashed border-[var(--card-border)] text-xs text-zinc-400 font-bold shadow-sm">
                            <Camera className="w-4 h-4 text-purple-400" />
                            <span>No active stories yet</span>
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
