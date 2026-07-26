"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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

    const mockStories: StoryUser[] = [
        {
            id: "1",
            name: "Aarav S.",
            avatar: "",
            hasUnseen: true,
            stories: [
                { id: "s1", mediaUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800", caption: "Coding late night DSA 🚀", timestamp: "2h ago" },
            ],
        },
        {
            id: "2",
            name: "Sneha P.",
            avatar: "",
            hasUnseen: true,
            stories: [
                { id: "s2", mediaUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800", caption: "Group study session at campus library 📚", timestamp: "4h ago" },
            ],
        },
        {
            id: "3",
            name: "Rohan G.",
            avatar: "",
            hasUnseen: false,
            stories: [
                { id: "s3", mediaUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800", caption: "Hackathon submission complete! 🎉", timestamp: "8h ago" },
            ],
        },
    ];

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

                    {/* Active User Stories */}
                    {mockStories.map((storyUser, idx) => (
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
                    ))}

                </div>
            </div>

            {/* Fullscreen Story Viewer Modal */}
            {activeStoryIndex !== null && (
                <StoryViewerModal
                    storyUsers={mockStories}
                    initialIndex={activeStoryIndex}
                    onClose={() => setActiveStoryIndex(null)}
                />
            )}
        </>
    );
}
