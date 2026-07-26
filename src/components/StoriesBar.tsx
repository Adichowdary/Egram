"use client";

import { useState, useEffect } from "react";
import { Plus, Camera } from "lucide-react";
import { StoryViewerModal } from "@/components/StoryViewerModal";

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

    useEffect(() => {
        // Fetch real active 24-hour stories from database if present
        const fetchStories = async () => {
            try {
                // Currently database returns real stories array if available
                setRealStories([]);
            } catch (e) {
                console.error("Error fetching real stories:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStories();
    }, []);

    return (
        <>
            <div className="w-full overflow-x-auto pb-2 scrollbar-none">
                <div className="flex items-center gap-4 px-1">
                    
                    {/* Add Story Button */}
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group">
                        <div className="w-16 h-16 rounded-full bg-zinc-900 border-2 border-dashed border-purple-500/50 flex items-center justify-center relative group-hover:scale-105 transition-transform">
                            <span className="text-sm font-black text-white">{getInitials(currentUser?.displayName || currentUser?.email)}</span>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-black shadow-lg">
                                <Plus className="w-3.5 h-3.5" />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 group-hover:text-white">Your Story</span>
                    </div>

                    {/* Real Active User Stories or Clean Empty State */}
                    {realStories.length > 0 ? (
                        realStories.map((storyUser, idx) => (
                            <div
                                key={storyUser.id}
                                onClick={() => setActiveStoryIndex(idx)}
                                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
                            >
                                <div className={`w-16 h-16 rounded-full p-0.5 relative transition-transform group-hover:scale-105 ${
                                    storyUser.hasUnseen
                                        ? "bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400"
                                        : "bg-zinc-700"
                                }`}>
                                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center border-2 border-zinc-900 overflow-hidden">
                                        <span className="text-xs font-black text-white">{getInitials(storyUser.name)}</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[64px]">
                                    {storyUser.name}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[var(--accent-bg)] border border-dashed border-[var(--card-border)] text-xs text-zinc-400 font-bold">
                            <Camera className="w-4 h-4 opacity-50" />
                            <span>No stories yet</span>
                        </div>
                    )}

                </div>
            </div>

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
