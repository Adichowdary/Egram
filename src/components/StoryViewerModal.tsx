"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Heart } from "lucide-react";

interface StoryViewerModalProps {
    storyUsers: any[];
    initialIndex: number;
    onClose: () => void;
}

export function StoryViewerModal({ storyUsers, initialIndex, onClose }: StoryViewerModalProps) {
    const [userIndex, setUserIndex] = useState(initialIndex);
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    const currentUserStory = storyUsers[userIndex];
    const currentStory = currentUserStory?.stories[storyIndex];

    useEffect(() => {
        setProgress(0);
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + 2; // 5 second duration total
            });
        }, 100);

        return () => clearInterval(timer);
    }, [userIndex, storyIndex]);

    const handleNext = () => {
        if (storyIndex < currentUserStory.stories.length - 1) {
            setStoryIndex((prev) => prev + 1);
        } else if (userIndex < storyUsers.length - 1) {
            setUserIndex((prev) => prev + 1);
            setStoryIndex(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (storyIndex > 0) {
            setStoryIndex((prev) => prev - 1);
        } else if (userIndex > 0) {
            setUserIndex((prev) => prev - 1);
            setStoryIndex(0);
        }
    };

    if (!currentStory) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="relative w-full max-w-sm h-[80vh] rounded-[32px] overflow-hidden bg-zinc-900 shadow-2xl flex flex-col justify-between border border-zinc-800">
                
                {/* Background Media */}
                <img
                    src={currentStory.mediaUrl}
                    alt="Story"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />

                {/* Top Controls & Progress Bar */}
                <div className="relative z-10 p-4 space-y-3">
                    <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-black text-white">
                                {currentUserStory.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-black text-white leading-tight">{currentUserStory.name}</p>
                                <p className="text-[10px] text-zinc-300 font-medium">{currentStory.timestamp}</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Navigation Touch Areas */}
                <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-md"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                {/* Bottom Footer Actions (Caption & Like Button) */}
                <div className="relative z-20 p-4 sm:p-5 space-y-3 flex flex-col items-center">
                    {currentStory.caption && (
                        <p className="text-xs font-bold text-white bg-black/70 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center max-w-[85%]">
                            {currentStory.caption}
                        </p>
                    )}

                    {/* Interactive Story Like Symbol */}
                    <div className="flex items-center justify-between w-full pt-1">
                        <button
                            onClick={() => {
                                setIsLiked(!isLiked);
                                setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full backdrop-blur-xl border transition-all active:scale-95 ${
                                isLiked
                                    ? "bg-red-500/20 border-red-500/50 text-red-500 shadow-lg shadow-red-500/20"
                                    : "bg-black/60 border-white/20 text-white hover:bg-black/80"
                            }`}
                        >
                            <Heart className={`w-5 h-5 transition-transform ${isLiked ? "fill-red-500 scale-110" : ""}`} />
                            <span className="text-xs font-extrabold">{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                        </button>

                        <button
                            onClick={handleNext}
                            className="px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold hover:bg-white/20 backdrop-blur-md transition-all"
                        >
                            Next Story →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
