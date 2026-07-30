"use client";

import { useState, useRef } from "react";
import { X, Camera, Save, User, Mail, GraduationCap, BookOpen, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
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
                const formData = new FormData();
                formData.append("file", file);
                formData.append("bucket", "avatars");
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    photoPath = uploadData.url;
                } else {
                    photoPath = await new Promise((resolve) => {
                        const r = new FileReader();
                        r.onload = (ev) => resolve(ev.target?.result as string);
                        r.readAsDataURL(file);
                    });
                }
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

            try {
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, { photoURL: photoPath, avatarUrl: photoPath }, { merge: true });
            } catch (e) {
                console.error("Firestore sync error:", e);
            }

            window.dispatchEvent(new CustomEvent("userProfileUpdated", { detail: { avatarUrl: photoPath } }));
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

                try {
                    const userRef = doc(db, "users", user.uid);
                    await setDoc(userRef, { displayName: name.trim(), photoURL: avatarUrl, avatarUrl }, { merge: true });
                } catch (e) {
                    console.error("Firestore sync error:", e);
                }

                window.dispatchEvent(new CustomEvent("userProfileUpdated", { detail: { avatarUrl, name: name.trim() } }));
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="w-full max-w-lg glass-card border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-lg font-black text-[var(--text-dark)] tracking-tight">Edit Profile</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-[var(--accent-bg)] text-[var(--text-light)] hover:text-[var(--text-dark)] transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto no-scrollbar flex-1">
                        
                        {/* Avatar Section */}
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                            <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/50 bg-indigo-500/10 flex items-center justify-center text-lg font-black text-indigo-500 shadow-md">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{name ? name.substring(0, 2).toUpperCase() : "U"}</span>
                                    )}
                                </div>
                                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Camera className="w-5 h-5" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-sm font-extrabold text-[var(--text-dark)]">{name || "Student"}</h4>
                                <p className="text-xs text-[var(--text-light)]">{user.email}</p>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
                                >
                                    {isUploading ? "Uploading..." : "Change Profile Photo"}
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

                        {/* Full Name */}
                        <div className="space-y-1">
                            <label className="text-xs font-black text-[var(--text-dark)] uppercase tracking-wider">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="E.g., Alex Rivers"
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-dark)] font-bold outline-none transition-all placeholder:text-[var(--text-light)]"
                                required
                            />
                        </div>

                        {/* Username */}
                        <div className="space-y-1">
                            <label className="text-xs font-black text-[var(--text-dark)] uppercase tracking-wider">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="E.g., alex_dev"
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-dark)] font-bold outline-none transition-all placeholder:text-[var(--text-light)]"
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                            <label className="text-xs font-black text-[var(--text-dark)] uppercase tracking-wider">Bio & Interests</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="E.g., Full Stack Engineer & Open Source contributor. Learning AI systems and building modern apps!"
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-dark)] font-medium outline-none transition-all resize-none h-24 placeholder:text-[var(--text-light)]"
                            />
                        </div>

                        {/* University / College */}
                        <div className="space-y-1">
                            <label className="text-xs font-black text-[var(--text-dark)] uppercase tracking-wider">University / College</label>
                            <input
                                type="text"
                                value={college}
                                onChange={(e) => setCollege(e.target.value)}
                                placeholder="E.g., Stanford University / MIT"
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-dark)] font-bold outline-none transition-all placeholder:text-[var(--text-light)]"
                            />
                        </div>

                        {/* Branch / Major */}
                        <div className="space-y-1">
                            <label className="text-xs font-black text-[var(--text-dark)] uppercase tracking-wider">Branch / Major</label>
                            <input
                                type="text"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                placeholder="E.g., Computer Science & Engineering"
                                className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[var(--text-dark)] font-bold outline-none transition-all placeholder:text-[var(--text-light)]"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-[var(--card-border)] flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2.5 rounded-xl border border-[var(--card-border)] text-xs font-bold text-[var(--text-light)] hover:text-[var(--text-dark)] transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-black text-xs hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                            </button>
                        </div>

                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
