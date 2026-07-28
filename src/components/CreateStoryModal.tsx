"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ToastProvider";

interface CreateStoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: any;
    onStoryCreated: () => void;
}

export function CreateStoryModal({ isOpen, onClose, currentUser, onStoryCreated }: CreateStoryModalProps) {
    const [caption, setCaption] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                addToast("Image size must be under 10MB", "error");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imagePreview || !currentUser || isUploading) return;

        setIsUploading(true);
        try {
            const res = await fetch("/api/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUser.uid,
                    userName: currentUser.displayName || currentUser.email?.split('@')[0] || "Student",
                    userAvatar: currentUser.photoURL || "",
                    mediaUrl: imagePreview,
                    caption
                })
            });

            if (res.ok) {
                addToast("Story published! Active for 24 hours 🔥", "success");
                setImagePreview(null);
                setCaption("");
                onStoryCreated();
                onClose();
            } else {
                addToast("Failed to publish story. Please try again.", "error");
            }
        } catch (error) {
            console.error("Error creating story:", error);
            addToast("Failed to publish story", "error");
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden relative"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            <h2 className="text-lg font-bold text-white">Add to Your Story</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                            className="hidden"
                        />

                        {imagePreview ? (
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/5] flex items-center justify-center border border-zinc-800 group">
                                <img src={imagePreview} alt="Story preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImagePreview(null)}
                                    className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/90 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-zinc-700 hover:border-purple-500 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors bg-zinc-950/50 group"
                            >
                                <div className="w-14 h-14 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-7 h-7" />
                                </div>
                                <span className="text-sm font-bold text-zinc-200 mb-1">Upload Photo</span>
                                <span className="text-xs text-zinc-500">Share a moment with your circle (24h)</span>
                            </div>
                        )}

                        <div>
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder:text-zinc-500 outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!imagePreview || isUploading}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
                        >
                            {isUploading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Share Story</span>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
