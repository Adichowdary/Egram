"use client";

import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Sparkles, Send, Video, Globe, Star, Users, Check, UploadCloud } from "lucide-react";
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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [audience, setAudience] = useState<'public' | 'close_friends' | 'students'>('public');
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addToast } = useToast();

    // Clean up ObjectURL previews to prevent memory leaks
    useEffect(() => {
        return () => {
            if (mediaPreview && mediaPreview.startsWith('blob:')) {
                URL.revokeObjectURL(mediaPreview);
            }
        };
    }, [mediaPreview]);

    const compressImage = (file: File): Promise<Blob | File> => {
        return new Promise((resolve) => {
            if (!file.type.startsWith("image/")) {
                resolve(file);
                return;
            }
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(objectUrl);
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const MAX_DIM = 1280;

                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                        height = Math.round((height * MAX_DIM) / width);
                        width = MAX_DIM;
                    } else {
                        width = Math.round((width * MAX_DIM) / height);
                        height = MAX_DIM;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    resolve(file);
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                                type: "image/jpeg",
                                lastModified: Date.now()
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    "image/jpeg",
                    0.82
                );
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(file);
            };
            img.src = objectUrl;
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size threshold (50MB maximum)
            if (file.size > 50 * 1024 * 1024) {
                addToast("⚠️ This file is not uploaded! File is too large (Not enough space). Please select a file under 50MB.", "error");
                e.target.value = "";
                return;
            }

            const isVid = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v|ogg)$/i) !== null;
            setMediaType(isVid ? 'video' : 'image');

            if (isVid && file.size > 30 * 1024 * 1024) {
                addToast("⚠️ Large video file selected. Ensure you have a stable network connection.", "info");
            }

            if (!isVid) {
                const compressed = await compressImage(file);
                setSelectedFile(compressed as File);
                const objectUrl = URL.createObjectURL(compressed);
                setMediaPreview(objectUrl);
            } else {
                setSelectedFile(file);
                const objectUrl = URL.createObjectURL(file);
                setMediaPreview(objectUrl);
            }
        }
    };

    const handleResetMedia = () => {
        if (mediaPreview && mediaPreview.startsWith('blob:')) {
            URL.revokeObjectURL(mediaPreview);
        }
        setMediaPreview(null);
        setSelectedFile(null);
        setCaption("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile && !mediaPreview) {
            addToast("Please select an image or video to share", "error");
            return;
        }
        if (!currentUser || isUploading) return;

        setIsUploading(true);
        try {
            let finalMediaUrl = "";

            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("bucket", "stories");
                
                try {
                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData,
                    });
                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        if (uploadData.url) {
                            finalMediaUrl = uploadData.url;
                        }
                    } else {
                        console.warn("Server upload response not ok, attempting fallback");
                    }
                } catch (uploadErr) {
                    console.error("Direct upload failed, using DataURL fallback:", uploadErr);
                }
            }

            // Fallback to FileReader base64 if server upload endpoint is offline
            if (!finalMediaUrl && selectedFile) {
                finalMediaUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (evt) => resolve(evt.target?.result as string);
                    reader.readAsDataURL(selectedFile);
                });
            }

            if (!finalMediaUrl && mediaPreview) {
                finalMediaUrl = mediaPreview;
            }

            if (!finalMediaUrl) {
                addToast("⚠️ This file was not uploaded! Not enough space or file preparation failed.", "error");
                throw new Error("Unable to prepare media for status");
            }

            const res = await fetch("/api/stories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: currentUser.uid || currentUser.id || "user_guest",
                    userName: currentUser.displayName || currentUser.email?.split('@')[0] || "Student",
                    userAvatar: currentUser.photoURL || "",
                    mediaUrl: finalMediaUrl,
                    mediaType,
                    caption,
                    audience
                })
            });

            if (res.ok) {
                addToast("Status posted! Active on your story for 24 hours 🔥", "success");
                handleResetMedia();
                onStoryCreated();
                onClose();
            } else {
                const errData = await res.json().catch(() => ({}));
                addToast(errData.error || "⚠️ This file was not uploaded! Storage limit reached or invalid media.", "error");
            }
        } catch (error) {
            console.error("Error creating story:", error);
            addToast("⚠️ This file was not uploaded! File size is too large or network failed.", "error");
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    const audienceOptions = [
        {
            id: 'public',
            label: 'Your Story',
            desc: 'Visible to everyone in your circle (24h)',
            icon: Globe,
            gradient: 'from-amber-500 via-rose-500 to-purple-600',
            badgeClass: 'bg-gradient-to-r from-amber-500 to-purple-600 text-white'
        },
        {
            id: 'close_friends',
            label: 'Close Friends',
            desc: 'Shared exclusively with close friends',
            icon: Star,
            gradient: 'from-emerald-500 to-teal-600',
            badgeClass: 'bg-emerald-500 text-white'
        },
        {
            id: 'students',
            label: 'Students Only',
            desc: 'Visible to verified student circle',
            icon: Users,
            gradient: 'from-blue-600 to-cyan-500',
            badgeClass: 'bg-blue-600 text-white'
        }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
            >
                <motion.div
                    initial={{ scale: 0.94, y: 25 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.94, y: 25 }}
                    transition={{ type: "spring", damping: 26, stiffness: 320 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xl bg-zinc-950 border-2 border-zinc-800 rounded-[36px] shadow-2xl overflow-hidden relative my-auto flex flex-col max-h-[92vh]"
                >
                    {/* Instagram Story Top Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 shadow-md">
                                <img
                                    src={currentUser?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"}
                                    alt="User"
                                    className="w-full h-full rounded-full object-cover border border-zinc-900"
                                />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-1.5">
                                    <span>Create Story</span>
                                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                                </h2>
                                <p className="text-xs text-zinc-400 font-medium">Instagram-style status update</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 space-y-5 flex-1 flex flex-col justify-between">
                        
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*,video/*"
                            className="hidden"
                        />

                        {/* Media Upload / Preview Canvas */}
                        {mediaPreview ? (
                            <div className="relative rounded-[28px] overflow-hidden bg-black aspect-[9/12] max-h-[340px] sm:max-h-[380px] w-full flex items-center justify-center border-2 border-zinc-800 shadow-2xl group mx-auto">
                                {mediaType === 'video' ? (
                                    <video
                                        src={mediaPreview}
                                        controls
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={mediaPreview}
                                        alt="Story Preview"
                                        className="w-full h-full object-cover"
                                    />
                                )}

                                {/* Overlay Caption Badge Preview */}
                                {caption.trim() && (
                                    <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center shadow-xl">
                                        <p className="text-sm font-bold text-white leading-snug break-words">{caption}</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleResetMedia}
                                    className="absolute top-3 right-3 p-2.5 bg-black/75 text-white rounded-full hover:bg-black/90 transition-all z-30 shadow-lg cursor-pointer hover:scale-105 active:scale-95"
                                    title="Remove & Pick New Media"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-3 border-dashed border-zinc-700 hover:border-purple-500/80 rounded-[30px] p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all bg-zinc-900/40 hover:bg-zinc-900/80 group min-h-[220px] shadow-inner"
                            >
                                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xl shadow-purple-600/30">
                                    <UploadCloud className="w-8 h-8" />
                                </div>
                                <span className="text-base sm:text-lg font-black text-white mb-1.5 text-center">
                                    Upload Photo or Video Status
                                </span>
                                <span className="text-xs sm:text-sm text-zinc-400 text-center font-medium max-w-xs">
                                    Select any image (JPG, PNG) or video (MP4, MOV) from your device to share (24h)
                                </span>
                                <div className="mt-4 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-2">
                                    <Video className="w-4 h-4" />
                                    <span>Supports photos & videos up to 50MB</span>
                                </div>
                            </div>
                        )}

                        {/* Extra Large Add Caption Field */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm sm:text-base font-black text-white">Add Caption</label>
                                <span className="text-xs font-bold text-zinc-400">{caption.length}/150</span>
                            </div>
                            <input
                                type="text"
                                maxLength={150}
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Type a story caption or quote..."
                                className="w-full bg-zinc-900 border-2 border-zinc-700/90 focus:border-purple-500 rounded-2xl px-5 py-4 sm:py-4.5 text-base sm:text-lg text-white font-bold placeholder:text-zinc-500 focus:outline-none transition-all shadow-inner"
                            />
                        </div>

                        {/* Extra Large Sharing Status & Audience Options (Instagram Style) */}
                        <div className="space-y-2.5">
                            <label className="text-sm sm:text-base font-black text-white ml-1">Sharing Status & Audience</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {audienceOptions.map((opt) => {
                                    const Icon = opt.icon;
                                    const isSelected = audience === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => setAudience(opt.id as any)}
                                            className={`flex sm:flex-col items-center justify-between sm:justify-center gap-3 p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer text-left sm:text-center ${
                                                isSelected
                                                    ? "bg-purple-600/20 border-purple-500 text-white shadow-xl scale-[1.02]"
                                                    : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                                            }`}
                                        >
                                            <div className="flex items-center sm:flex-col gap-2.5">
                                                <div className={`p-2.5 rounded-xl ${isSelected ? opt.badgeClass : "bg-zinc-800 text-zinc-300"}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-black leading-tight">{opt.label}</p>
                                                    <p className="text-[10px] text-zinc-400 font-medium hidden sm:block mt-1">{opt.desc}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Full Width Signature Instagram Share Button */}
                        <button
                            type="submit"
                            disabled={!mediaPreview || isUploading}
                            className="w-full mt-2 py-4.5 sm:py-5 rounded-2xl font-black text-base sm:text-lg text-white bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-purple-600/40 cursor-pointer"
                        >
                            {isUploading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5.5 h-5.5" />
                                    <span>Share to Your Story</span>
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
