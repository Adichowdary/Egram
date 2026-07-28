"use client";

import { useState, useRef } from "react";
import { X, Camera, Save, User, Mail, GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile } from "firebase/auth";
import { auth, storage } from "@/lib/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/components/ToastProvider";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    currentData: any;
    onProfileUpdated: (updatedData: any) => void;
}

export function EditProfileModal({ isOpen, onClose, user, currentData, onProfileUpdated }: EditProfileModalProps) {
    const { addToast } = useToast();
    const [name, setName] = useState(currentData?.displayName || currentData?.name || "");
    const [username, setUsername] = useState(currentData?.username || "");
    const [bio, setBio] = useState(currentData?.bio || "");
    const [college, setCollege] = useState(currentData?.college || "");
    const [branch, setBranch] = useState(currentData?.branch || "");
    const [year, setYear] = useState(currentData?.year || "");
    const [avatarUrl, setAvatarUrl] = useState(currentData?.photoURL || currentData?.avatarUrl || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);

        // Optimistic local preview
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) {
                setAvatarUrl(evt.target.result as string);
            }
        };
        reader.readAsDataURL(file);

        try {
            let photoPath = "";
            try {
                const sRef = storageRef(storage, `avatars/${user.uid}_${Date.now()}`);
                const snap = await uploadBytes(sRef, file);
                photoPath = await getDownloadURL(snap.ref);
            } catch {
                photoPath = await new Promise((resolve) => {
                    const r = new FileReader();
                    r.onload = (ev) => resolve(ev.target?.result as string);
                    r.readAsDataURL(file);
                });
            }

            setAvatarUrl(photoPath);
            await updateProfile(auth.currentUser!, { photoURL: photoPath }).catch(() => {});
            await fetch(`/api/users/${user.uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl: photoPath }),
            });

            window.dispatchEvent(new Event("userProfileUpdated"));
            addToast("Profile picture updated!", "success");
        } catch (err) {
            console.error(err);
            addToast("Failed to upload avatar", "error");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSaving(true);
        try {
            const updatedPayload = {
                name: name.trim(),
                username: username.trim(),
                bio: bio.trim(),
                college: college.trim(),
                branch: branch.trim(),
                year: year.trim(),
                avatarUrl
            };

            const res = await fetch(`/api/users/${user.uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedPayload),
            });

            if (res.ok) {
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { displayName: name.trim() }).catch(() => {});
                }

                window.dispatchEvent(new Event("userProfileUpdated"));
                onProfileUpdated(updatedPayload);
                addToast("Profile updated successfully!", "success");
                onClose();
            } else {
                addToast("Failed to save profile changes", "error");
            }
        } catch (err) {
            console.error(err);
            addToast("Failed to save profile changes", "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-lg bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between bg-zinc-950/40">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-black text-[var(--text-dark)] tracking-tight">Edit Profile</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form Scroll Body */}
                    <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                        
                        {/* Avatar Section */}
                        <div className="space-y-3 p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                            <div className="flex items-center gap-5">
                                <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/50 bg-zinc-900 flex items-center justify-center text-xl font-black shadow-lg">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-white text-2xl">{name ? name.substring(0, 2).toUpperCase() : "U"}</span>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-white">{name || "Student"}</h4>
                                    <p className="text-xs text-zinc-400">{user.email}</p>
                                    <button
                                        type="button"
                                        disabled={isUploading}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs font-bold text-blue-400 hover:underline pt-1 block"
                                    >
                                        {isUploading ? "Uploading photo..." : "Upload New Photo"}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleAvatarUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Quick Emoji Avatar Picker Grid */}
                            <div className="pt-2 border-t border-[var(--card-border)]">
                                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-2">Or Choose an Avatar Emoji</label>
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                                    {["🎓", "🚀", "💻", "🧠", "⚡", "🔥", "🏆", "🌟", "🎨", "🧪", "🦁", "🦊", "🦉", "🦄", "👨‍🎓", "👩‍🎓"].map((emoji) => {
                                        const generateSvg = (e: string) => {
                                            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#9333ea"/></linearGradient></defs><circle cx="50" cy="50" r="50" fill="url(#g)"/><text x="50%" y="55%" font-size="52" text-anchor="middle" dominant-baseline="middle">${e}</text></svg>`;
                                            return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                                        };
                                        return (
                                            <button
                                                key={emoji}
                                                type="button"
                                                onClick={() => {
                                                    const svgUrl = generateSvg(emoji);
                                                    setAvatarUrl(svgUrl);
                                                    addToast(`Selected ${emoji} avatar!`, "info");
                                                }}
                                                className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-blue-600/30 border border-zinc-700/60 flex items-center justify-center text-lg hover:scale-110 active:scale-95 transition-all flex-shrink-0"
                                                title={`Set ${emoji} as avatar`}
                                            >
                                                {emoji}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5 ml-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] text-[var(--text-dark)] text-base sm:text-lg font-bold rounded-2xl px-4.5 py-4 min-h-[52px] sm:min-h-[56px] outline-none focus:border-blue-500 transition-colors"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5 ml-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] text-[var(--text-dark)] text-base sm:text-lg font-bold rounded-2xl px-4.5 py-4 min-h-[52px] sm:min-h-[56px] outline-none focus:border-blue-500 transition-colors"
                                placeholder="username"
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5 ml-1">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] text-[var(--text-dark)] text-base sm:text-lg font-medium rounded-2xl p-4 outline-none focus:border-blue-500 resize-none h-28 transition-colors"
                                placeholder="Share a short bio about your goals and interests..."
                                maxLength={160}
                            />
                        </div>

                        {/* Academic Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5 ml-1">College / Uni</label>
                                <input
                                    type="text"
                                    value={college}
                                    onChange={(e) => setCollege(e.target.value)}
                                    className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] text-[var(--text-dark)] text-base sm:text-lg font-bold rounded-2xl px-4.5 py-4 min-h-[52px] sm:min-h-[56px] outline-none focus:border-blue-500 transition-colors"
                                    placeholder="e.g. Stanford University"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5 ml-1">Branch & Year</label>
                                <input
                                    type="text"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] text-[var(--text-dark)] text-base sm:text-lg font-bold rounded-2xl px-4.5 py-4 min-h-[52px] sm:min-h-[56px] outline-none focus:border-blue-500 transition-colors"
                                    placeholder="e.g. Computer Science - 3rd Year"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 border-t border-[var(--card-border)] flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3.5 rounded-2xl bg-zinc-800 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-colors min-h-[48px]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black shadow-lg shadow-blue-500/20 hover:opacity-95 disabled:opacity-50 flex items-center gap-2 min-h-[48px]"
                            >
                                <Save className="w-4.5 h-4.5" />
                                <span>{isSaving ? "Saving..." : "Save Profile"}</span>
                            </button>
                        </div>

                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
