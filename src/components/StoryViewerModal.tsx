"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Eye, Send, Play, Pause, Volume2, VolumeX, MessageCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useToast } from "@/components/ToastProvider";

interface StoryViewerModalProps {
    storyUsers: any[];
    initialIndex: number;
    onClose: () => void;
}

export function StoryViewerModal({ storyUsers, initialIndex, onClose }: StoryViewerModalProps) {
    const [userIndex, setUserIndex] = useState(initialIndex);
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [viewsCount, setViewsCount] = useState(0);
    const [viewsList, setViewsList] = useState<any[]>([]);
    const [showViewersSheet, setShowViewersSheet] = useState(false);

    const [replyText, setReplyText] = useState("");
    const [isSendingReply, setIsSendingReply] = useState(false);
    const { addToast } = useToast();

    const currentUserStory = storyUsers[userIndex];
    const currentStory = currentUserStory?.stories[storyIndex];
    const isOwner = auth.currentUser?.uid === currentUserStory?.id;

    // Track Story View & Fetch Story Details
    useEffect(() => {
        if (!currentStory?.id) return;

        setViewsList(currentStory.views || []);
        setViewsCount(currentStory.views?.length || 0);

        const likes = currentStory.likes || [];
        setLikesCount(likes.length);
        setIsLiked(likes.some((l: any) => l.userId === auth.currentUser?.uid));

        // Send view ping if not owned by self
        if (auth.currentUser?.uid && !isOwner) {
            fetch("/api/stories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storyId: currentStory.id,
                    action: "view",
                    userId: auth.currentUser.uid,
                    userName: auth.currentUser.displayName || "User",
                    userAvatar: auth.currentUser.photoURL || ""
                })
            }).then(async (res) => {
                if (res.ok) {
                    const data = await res.json();
                    if (data.views) {
                        setViewsList(data.views);
                        setViewsCount(data.views.length);
                    }
                }
            }).catch(console.error);
        }
    }, [userIndex, storyIndex, currentStory?.id, isOwner]);

    // Progress Bar Timer
    useEffect(() => {
        if (isPaused || showViewersSheet) return;

        setProgress(0);
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + 2; // 5 seconds per story slide
            });
        }, 100);

        return () => clearInterval(timer);
    }, [userIndex, storyIndex, isPaused, showViewersSheet]);

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

    const handleToggleLike = async () => {
        if (!auth.currentUser || !currentStory?.id) return;

        const nextLikedState = !isLiked;
        setIsLiked(nextLikedState);
        setLikesCount(prev => nextLikedState ? prev + 1 : Math.max(0, prev - 1));

        try {
            await fetch("/api/stories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    storyId: currentStory.id,
                    action: "like",
                    userId: auth.currentUser.uid,
                    userName: auth.currentUser.displayName || "User",
                    userAvatar: auth.currentUser.photoURL || ""
                })
            });
        } catch (e) {
            console.error("Like toggle error:", e);
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !auth.currentUser || isSendingReply) return;

        setIsSendingReply(true);
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    senderId: auth.currentUser.uid,
                    receiverId: currentUserStory.id,
                    content: `Replied to status: "${replyText.trim()}"`
                })
            });

            if (res.ok) {
                addToast(`Reply sent to ${currentUserStory.name}!`, "success");
                setReplyText("");
            } else {
                addToast("Failed to send reply", "error");
            }
        } catch (e) {
            console.error("Reply error:", e);
            addToast("Failed to send reply", "error");
        } finally {
            setIsSendingReply(false);
        }
    };

    if (!currentStory) return null;

    const isVideo = currentStory.mediaType === 'video' || !!currentStory.mediaUrl?.match(/\.(mp4|webm|mov|ogg|m4v)/i) || currentStory.mediaUrl?.includes('/video/');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-4">
            <div className="relative w-full max-w-sm h-[88vh] sm:h-[82vh] rounded-[32px] overflow-hidden bg-zinc-950 shadow-2xl flex flex-col justify-between border border-zinc-800/90">
                
                {/* Background Media (Image or Video) */}
                {isVideo ? (
                    <video
                        src={currentStory.mediaUrl}
                        autoPlay
                        loop
                        playsInline
                        muted={isMuted}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <img
                        src={currentStory.mediaUrl}
                        alt="Story"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />

                {/* Top Controls & Story Progress Bar */}
                <div className="relative z-20 p-4 space-y-3">
                    
                    {/* Story Progress Indicators */}
                    <div className="flex gap-1.5 w-full">
                        {currentUserStory.stories.map((st: any, idx: number) => (
                            <div key={st.id || idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white transition-all duration-100 ease-linear"
                                    style={{
                                        width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Author Bar */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-lg flex-shrink-0">
                                {currentUserStory.avatar ? (
                                    <img src={currentUserStory.avatar} alt={currentUserStory.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-black text-white">
                                        {currentUserStory.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <p className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
                                    <span>{currentUserStory.name}</span>
                                    {isOwner && <span className="text-[10px] bg-purple-600/80 px-2 py-0.5 rounded-full text-white font-extrabold">You</span>}
                                </p>
                                <p className="text-[10px] text-zinc-300 font-medium">Status Update</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isVideo && (
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                                >
                                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                            )}

                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                            >
                                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </button>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Left/Right Tap Areas */}
                <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors backdrop-blur-md"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors backdrop-blur-md"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                {/* Bottom Footer Actions (Caption, Viewer Sheet Trigger, Reply Input) */}
                <div className="relative z-20 p-4 sm:p-5 space-y-3 flex flex-col items-center">
                    
                    {currentStory.caption && (
                        <p className="text-xs font-bold text-white bg-black/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/10 text-center max-w-[90%] shadow-lg">
                            {currentStory.caption}
                        </p>
                    )}

                    {/* Viewer Counter Button (For Story Owner) & Interactive Likes */}
                    <div className="flex items-center justify-between w-full gap-3 pt-1">
                        {isOwner ? (
                            <button
                                onClick={() => { setShowViewersSheet(true); setIsPaused(true); }}
                                className="flex items-center gap-2.5 px-5 py-3 rounded-2xl sm:rounded-full bg-black/85 border-2 border-purple-500/50 text-white text-sm sm:text-base font-black hover:bg-black/95 backdrop-blur-2xl transition-all shadow-xl active:scale-95 cursor-pointer"
                                title="View status viewers"
                            >
                                <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400 animate-pulse" />
                                <span>{viewsCount} {viewsCount === 1 ? 'View' : 'Views'}</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-sm sm:text-base text-zinc-100 font-extrabold bg-black/75 px-5 py-2.5 rounded-2xl sm:rounded-full border-2 border-white/20 shadow-md">
                                <Eye className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-purple-400" />
                                <span>{viewsCount}</span>
                            </div>
                        )}

                        <button
                            onClick={handleToggleLike}
                            className={`flex items-center gap-2.5 px-5.5 py-3 rounded-2xl sm:rounded-full backdrop-blur-2xl border-2 transition-all active:scale-95 cursor-pointer shadow-xl ${
                                isLiked
                                    ? "bg-red-500/25 border-red-500 text-red-400 shadow-red-500/30 scale-105"
                                    : "bg-black/85 border-white/30 text-white hover:bg-black/95"
                            }`}
                            title="Like status"
                        >
                            <Heart className={`w-6.5 h-6.5 sm:w-7 sm:h-7 transition-transform ${isLiked ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                            <span className="text-sm sm:text-base font-black">{likesCount}</span>
                        </button>
                    </div>

                    {/* Quick Direct Message Reply Input (When Viewing Someone Else's Story) */}
                    {!isOwner && (
                        <form onSubmit={handleSendReply} className="w-full flex items-center gap-2 pt-1">
                            <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Reply to ${currentUserStory.name}...`}
                                className="flex-1 bg-black/70 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-zinc-400 outline-none focus:border-purple-500 backdrop-blur-xl font-medium"
                            />
                            <button
                                type="submit"
                                disabled={!replyText.trim() || isSendingReply}
                                className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    )}

                </div>

                {/* Instagram-Style Story Viewers Bottom Sheet */}
                {showViewersSheet && (
                    <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-2xl p-5 flex flex-col justify-between animate-in fade-in slide-in-from-bottom duration-200">
                        <div>
                            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <Eye className="w-7 h-7 text-purple-400" />
                                    <h3 className="text-base font-black text-white">Status Viewers ({viewsList.length})</h3>
                                </div>
                                <button
                                    onClick={() => { setShowViewersSheet(false); setIsPaused(false); }}
                                    className="p-2 rounded-full bg-zinc-800 text-zinc-300 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-none">
                                {viewsList.length > 0 ? (
                                    viewsList.map((viewer: any, idx: number) => (
                                        <div key={viewer.userId || idx} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-xs font-black text-white overflow-hidden">
                                                    {viewer.avatar ? (
                                                        <img src={viewer.avatar} alt={viewer.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        viewer.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white">{viewer.name}</p>
                                                    <p className="text-[10px] text-zinc-400">Viewed your status</p>
                                                </div>
                                            </div>
                                            <Eye className="w-5.5 h-5.5 text-purple-400" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-zinc-500 text-center py-8">No viewers yet</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => { setShowViewersSheet(false); setIsPaused(false); }}
                            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                            Back to Status
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
