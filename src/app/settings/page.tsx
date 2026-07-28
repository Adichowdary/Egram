"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { CreateMeetModal } from "@/components/CreateMeetModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { SplashScreen } from "@/components/SplashScreen";
import { useToast } from "@/components/ToastProvider";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { 
    User, Palette, Bell, Lock, Shield, Ban, AlertTriangle, 
    ChevronRight, ArrowLeft, LogOut, Save, Moon, Sun, Monitor,
    Check, Eye, EyeOff, UserX, Trash2, Camera, Sparkles, Sliders, Globe, Key
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const [user, setUser] = useState<any>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [loading, setLoading] = useState(!(typeof window !== "undefined" && auth?.currentUser));
    const [activeTab, setActiveTab] = useState<"account" | "appearance" | "notifications" | "privacy" | "security" | "blocked" | "control">("account");
    const [mobileView, setMobileView] = useState<"list" | "detail">("list");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const { theme: currentTheme, setTheme } = useTheme();

    // Account Form State
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [college, setCollege] = useState("");
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Notification Toggles
    const [notifications, setNotifications] = useState({
        likes: true,
        comments: true,
        messages: true,
        followers: true,
        mentions: true,
        study: true,
    });

    // Privacy Settings
    const [privacy, setPrivacy] = useState({
        isPrivate: false,
        messaging: "everyone",
        comments: "everyone",
        showOnline: true,
    });

    const router = useRouter();
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAvatarUrl(currentUser.photoURL || "");
                try {
                    const res = await fetch(`/api/users/${currentUser.uid}`);
                    if (res.ok) {
                        const data = await res.json();
                        setName(data.name || currentUser.displayName || "");
                        setUsername(data.username || currentUser.email?.split("@")[0] || "");
                        setBio(data.bio || "");
                        setCollege(data.college || "");
                        setBranch(data.branch || "");
                        setYear(data.year || "");
                        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingAvatar(true);

        // Instant local optimistic preview (< 1ms)
        const reader = new FileReader();
        reader.onload = (evt) => {
            if (evt.target?.result) setAvatarUrl(evt.target.result as string);
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
                    r.onload = (evt) => resolve(evt.target?.result as string);
                    r.readAsDataURL(file);
                });
            }

            setAvatarUrl(photoPath);

            // Update Auth Profile & DB asynchronously
            await updateProfile(auth.currentUser!, { photoURL: photoPath }).catch(() => {});
            await fetch(`/api/users/${user.uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatarUrl: photoPath }),
            });

            window.dispatchEvent(new Event("userProfileUpdated"));
            addToast("Profile avatar updated!", "success");
        } catch (err) {
            console.error(err);
            addToast("Failed to upload avatar", "error");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSaveAccount = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/users/${user.uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    username: username.trim(),
                    bio: bio.trim(),
                    college: college.trim(),
                    branch: branch.trim(),
                    year: year.trim(),
                }),
            });

            if (res.ok) {
                if (auth.currentUser) {
                    await updateProfile(auth.currentUser, { displayName: name.trim() }).catch(() => {});
                }
                window.dispatchEvent(new Event("userProfileUpdated"));
                addToast("Profile settings saved successfully!", "success");
            } else {
                addToast("Failed to save settings", "error");
            }
        } catch (err) {
            addToast("Failed to save settings", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        addToast("Logged out successfully", "info");
        router.push("/login");
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText.toLowerCase() !== "delete my account") {
            addToast("Please type 'DELETE MY ACCOUNT' to confirm", "error");
            return;
        }
        addToast("Account deactivation initiated", "info");
        setIsDeleteModalOpen(false);
        await signOut(auth);
        router.push("/login");
    };

    const getInitials = (n: string | null) => {
        if (!n) return "U";
        return n.substring(0, 2).toUpperCase();
    };

    const tabs = [
        { id: "account", label: "Account & Profile", icon: User, badge: "Primary" },
        { id: "appearance", label: "Appearance & Themes", icon: Palette, badge: "" },
        { id: "notifications", label: "Notification Rules", icon: Bell, badge: "" },
        { id: "privacy", label: "Privacy Controls", icon: Lock, badge: "" },
        { id: "security", label: "Security & Sessions", icon: Shield, badge: "" },
        { id: "blocked", label: "Blocked Accounts", icon: Ban, badge: "" },
        { id: "control", label: "Danger Zone", icon: AlertTriangle, badge: "" },
    ];

    return (
        <>
            <AnimatePresence>{loading && <SplashScreen key="splash" />}</AnimatePresence>

            {!loading && user && (
                <div className="min-h-screen bg-[var(--background)] text-[var(--text-dark)] pb-24 md:pb-8">
                    <Sidebar
                        user={user}
                        setIsModalOpen={setIsModalOpen}
                        setIsPostModalOpen={setIsPostModalOpen}
                        getInitials={getInitials}
                    />

                    <main className="main-content">
                        <div className="feed-column max-w-[760px] w-full space-y-6">

                            {/* Header Section */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center justify-between p-2"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                        <Sliders className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">Settings & Preferences</h1>
                                        <p className="text-xs text-[var(--text-light)] font-medium">
                                            Customize your profile, themes, privacy & account security
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all active:scale-95"
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </motion.div>

                            {/* Settings Container (Grid Layout) */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                                {/* Navigation Panel */}
                                <div className={`md:col-span-5 ${mobileView === "detail" ? "hidden md:block" : "block"}`}>
                                    <div className="glass rounded-3xl p-3 sm:p-4 border border-[var(--card-border)] space-y-2 shadow-2xl">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = activeTab === tab.id;
                                            const isDanger = tab.id === "control";
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => {
                                                        setActiveTab(tab.id as any);
                                                        setMobileView("detail");
                                                    }}
                                                    className={`w-full flex items-center justify-between p-4 rounded-2xl text-sm sm:text-base font-extrabold transition-all relative overflow-hidden ${
                                                        isActive
                                                            ? isDanger
                                                                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30"
                                                                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 scale-[1.01]"
                                                            : isDanger
                                                                ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                                : "text-[var(--text-light)] hover:text-[var(--text-dark)] hover:bg-[var(--accent-bg)]"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <Icon className="w-5.5 h-5.5 flex-shrink-0" />
                                                        <span className="tracking-tight">{tab.label}</span>
                                                    </div>
                                                    <ChevronRight className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? "translate-x-0 opacity-100" : "opacity-40"}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Main Details Content Panel */}
                                <div className={`md:col-span-7 ${mobileView === "list" ? "hidden md:block" : "block"}`}>
                                    <div className="glass rounded-3xl p-6 sm:p-7 border border-[var(--card-border)] relative shadow-2xl space-y-6">
                                        
                                        {/* Mobile Navigation Back Button */}
                                        <button
                                            onClick={() => setMobileView("list")}
                                            className="md:hidden flex items-center gap-1.5 text-xs font-bold text-blue-500 mb-2"
                                        >
                                            <ArrowLeft className="w-4 h-4" /> Back to Settings Navigation
                                        </button>

                                        {/* TABS CONTENT */}

                                        {/* 1. Account & Profile */}
                                        {activeTab === "account" && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="border-b border-[var(--card-border)] pb-4">
                                                    <h2 className="text-xl font-black">Account Profile</h2>
                                                    <p className="text-xs text-[var(--text-light)] mt-0.5">Manage your public information and avatar</p>
                                                </div>

                                                {/* Avatar Upload Section */}
                                                <div className="flex items-center gap-5 p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                                                    <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500/40 bg-zinc-900 flex items-center justify-center text-xl font-black">
                                                            {avatarUrl ? (
                                                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                getInitials(name || user.email)
                                                            )}
                                                        </div>
                                                        <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                            <Camera className="w-6 h-6" />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-bold">{name || "Student"}</h4>
                                                        <p className="text-xs text-[var(--text-light)]">{user.email}</p>
                                                        <button
                                                            type="button"
                                                            disabled={isUploadingAvatar}
                                                            onClick={() => avatarInputRef.current?.click()}
                                                            className="text-xs font-bold text-blue-500 hover:underline pt-1 block"
                                                        >
                                                            {isUploadingAvatar ? "Uploading avatar..." : "Change Profile Photo"}
                                                        </button>
                                                        <input
                                                            type="file"
                                                            ref={avatarInputRef}
                                                            onChange={handleAvatarUpload}
                                                            accept="image/*"
                                                            className="hidden"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Form Fields */}
                                                <div className="space-y-5">
                                                    <div>
                                                        <label className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">Full Name</label>
                                                        <input
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            className="w-full mt-2 p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-sm sm:text-base font-bold focus:outline-none focus:border-blue-500 transition-colors text-[var(--text-dark)]"
                                                            placeholder="Your Full Name"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">Username</label>
                                                        <input
                                                            value={username}
                                                            onChange={(e) => setUsername(e.target.value)}
                                                            className="w-full mt-2 p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-sm sm:text-base font-bold focus:outline-none focus:border-blue-500 transition-colors text-[var(--text-dark)]"
                                                            placeholder="username"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">Bio</label>
                                                        <textarea
                                                            value={bio}
                                                            onChange={(e) => setBio(e.target.value)}
                                                            className="w-full mt-2 p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-sm sm:text-base font-medium focus:outline-none focus:border-blue-500 resize-none h-28 transition-colors text-[var(--text-dark)]"
                                                            placeholder="Tell fellow learners about your focus goals..."
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                                        <div>
                                                            <label className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">College / Institution</label>
                                                            <input
                                                                value={college}
                                                                onChange={(e) => setCollege(e.target.value)}
                                                                placeholder="e.g. Stanford University"
                                                                className="w-full mt-2 p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors text-[var(--text-dark)]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">Branch & Academic Year</label>
                                                            <input
                                                                value={branch}
                                                                onChange={(e) => setBranch(e.target.value)}
                                                                placeholder="e.g. Computer Science - 3rd Year"
                                                                className="w-full mt-2 p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors text-[var(--text-dark)]"
                                                            />
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={handleSaveAccount}
                                                        disabled={isSaving}
                                                        className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base font-extrabold shadow-xl shadow-blue-500/20 hover:opacity-95 disabled:opacity-50 mt-6 active:scale-95 transition-transform"
                                                    >
                                                        <Save className="w-5 h-5" /> {isSaving ? "Saving..." : "Save Profile Changes"}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* 2. Appearance & Themes */}
                                        {activeTab === "appearance" && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="border-b border-[var(--card-border)] pb-4">
                                                    <h2 className="text-xl font-black">Appearance & Themes</h2>
                                                    <p className="text-xs text-[var(--text-light)] mt-0.5">Customize visual modes and design themes</p>
                                                </div>

                                                <div className="space-y-5">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Theme Options</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { id: "dark", label: "Dark OLED", icon: Moon },
                                                                { id: "light", label: "Light Theme", icon: Sun },
                                                                { id: "system", label: "System Default", icon: Monitor },
                                                            ].map((t) => {
                                                                const Icon = t.icon;
                                                                const isSelected = currentTheme === t.id;
                                                                return (
                                                                    <button
                                                                        key={t.id}
                                                                        onClick={() => {
                                                                            setTheme(t.id);
                                                                            addToast(`Theme switched to ${t.label}`, "info");
                                                                        }}
                                                                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-xs font-bold transition-all ${
                                                                            isSelected
                                                                                ? "border-blue-500 bg-blue-500/10 text-blue-400 shadow-md"
                                                                                : "border-[var(--card-border)] bg-[var(--accent-bg)] text-zinc-400 hover:text-white"
                                                                        }`}
                                                                    >
                                                                        <Icon className="w-6 h-6" />
                                                                        <span>{t.label}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] flex items-center justify-between">
                                                        <div>
                                                            <h4 className="text-xs font-bold">Glassmorphic Blur Effects</h4>
                                                            <p className="text-[11px] text-[var(--text-light)]">High performance backdrop blur filtering</p>
                                                        </div>
                                                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">Enabled</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* 3. Notifications */}
                                        {activeTab === "notifications" && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="border-b border-[var(--card-border)] pb-4">
                                                    <h2 className="text-xl font-black">Notification Rules</h2>
                                                    <p className="text-xs text-[var(--text-light)] mt-0.5">Control what activity triggers notifications</p>
                                                </div>

                                                <div className="space-y-3">
                                                    {Object.entries(notifications).map(([key, val]) => (
                                                        <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                                                            <div>
                                                                <p className="text-xs font-bold capitalize">{key} Notifications</p>
                                                                <p className="text-[11px] text-[var(--text-light)]">Alert when users engage with {key}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setNotifications((prev) => ({ ...prev, [key]: !val }))}
                                                                className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                                                                    val ? "bg-blue-600" : "bg-zinc-700"
                                                                }`}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${val ? "translate-x-6" : "translate-x-0"}`} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* 4. Privacy Controls */}
                                        {activeTab === "privacy" && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="border-b border-[var(--card-border)] pb-4">
                                                    <h2 className="text-xl font-black">Privacy Controls</h2>
                                                    <p className="text-xs text-[var(--text-light)] mt-0.5">Manage account visibility and interaction permissions</p>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                                                        <div>
                                                            <p className="text-xs font-bold">Private Account Profile</p>
                                                            <p className="text-[11px] text-[var(--text-light)]">Only approved followers can view your posts and activity</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setPrivacy((prev) => ({ ...prev, isPrivate: !prev.isPrivate }))}
                                                            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                                                                privacy.isPrivate ? "bg-blue-600" : "bg-zinc-700"
                                                            }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${privacy.isPrivate ? "translate-x-6" : "translate-x-0"}`} />
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                                                        <div>
                                                            <p className="text-xs font-bold">Show Activity & Online Status</p>
                                                            <p className="text-[11px] text-[var(--text-light)]">Allow friends to see when you are active on Egram</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setPrivacy((prev) => ({ ...prev, showOnline: !prev.showOnline }))}
                                                            className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                                                                privacy.showOnline ? "bg-blue-600" : "bg-zinc-700"
                                                            }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${privacy.showOnline ? "translate-x-6" : "translate-x-0"}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* 5. Security & Sessions */}
                                        {activeTab === "security" && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="border-b border-[var(--card-border)] pb-4">
                                                    <h2 className="text-xl font-black">Security & Active Sessions</h2>
                                                    <p className="text-xs text-[var(--text-light)] mt-0.5">Review active authentication sessions and OAuth logins</p>
                                                </div>

                                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Shield className="w-5 h-5" />
                                                        <h4 className="text-xs font-bold">Active Authenticated Session</h4>
                                                    </div>
                                                    <p className="text-xs text-zinc-300">
                                                        Logged in as: <strong className="text-white">{user.email}</strong>
                                                    </p>
                                                    <p className="text-[11px] text-zinc-400">UID: {user.uid}</p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* 6. Blocked Accounts */}
                                        {activeTab === "blocked" && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="border-b border-[var(--card-border)] pb-4">
                                                    <h2 className="text-xl font-black">Blocked Accounts</h2>
                                                    <p className="text-xs text-[var(--text-light)] mt-0.5">Manage blocked users who cannot contact or follow you</p>
                                                </div>

                                                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-[var(--card-border)] bg-[var(--accent-bg)]">
                                                    <UserX className="w-10 h-10 mx-auto text-zinc-500 opacity-40 mb-2" />
                                                    <p className="text-xs font-bold text-zinc-300">No blocked users</p>
                                                    <p className="text-[11px] text-[var(--text-light)] mt-1">You haven&apos;t blocked any learners yet.</p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* 7. Danger Zone */}
                                        {activeTab === "control" && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                                <div className="border-b border-red-500/30 pb-4">
                                                    <h2 className="text-xl font-black text-red-500">Account Danger Zone</h2>
                                                    <p className="text-xs text-zinc-400 mt-0.5">Irreversible account actions and data deletion</p>
                                                </div>

                                                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-4">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-red-400">Delete Egram Account</h4>
                                                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                                            Permanently delete your user profile, posts, comments, study rooms, and streak metrics. This action cannot be undone.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsDeleteModalOpen(true)}
                                                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Deactivate Account
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}

                                    </div>
                                </div>

                            </div>

                        </div>

                        <RightSidebar user={user} handleSignOut={() => auth.signOut()} getInitials={getInitials} />
                    </main>

                    {/* Logout Modal */}
                    {isLogoutModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <div className="glass rounded-3xl p-6 max-w-sm w-full border border-[var(--card-border)] text-center space-y-4 shadow-2xl">
                                <LogOut className="w-10 h-10 mx-auto text-purple-400" />
                                <h3 className="text-lg font-black">Confirm Sign Out</h3>
                                <p className="text-xs text-[var(--text-light)]">Are you sure you want to log out of Egram?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-700">
                                        Cancel
                                    </button>
                                    <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-black text-white shadow-lg">
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Account Modal */}
                    {isDeleteModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <div className="glass rounded-3xl p-6 max-w-sm w-full border border-red-500/30 text-center space-y-4 shadow-2xl">
                                <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
                                <h3 className="text-lg font-black text-red-400">Delete Account</h3>
                                <p className="text-xs text-zinc-300 leading-relaxed">
                                    This action is permanent. Type <span className="font-bold text-white font-mono">DELETE MY ACCOUNT</span> below to confirm.
                                </p>
                                <input
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE MY ACCOUNT"
                                    className="w-full p-3 rounded-xl bg-[var(--accent-bg)] border border-red-500/40 text-center text-xs font-bold focus:outline-none text-white"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300 hover:bg-zinc-700">
                                        Cancel
                                    </button>
                                    <button onClick={handleDeleteAccount} className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-black text-white">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <MobileNav onOpenCreatePost={() => setIsPostModalOpen(true)} onOpenCreateMeet={() => setIsModalOpen(true)} currentUserId={user.uid} />

                    <CreateMeetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} getInitials={getInitials} />
                    <CreatePostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} user={user} />
                </div>
            )}
        </>
    );
}
