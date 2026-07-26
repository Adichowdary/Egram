"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { CreateMeetModal } from "@/components/CreateMeetModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { SplashScreen } from "@/components/SplashScreen";
import { useToast } from "@/components/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import { 
    User, Palette, Bell, Lock, Shield, Ban, AlertTriangle, 
    ChevronRight, ArrowLeft, LogOut, Save, Moon, Sun, Monitor,
    Check, Eye, EyeOff, UserX, Trash2
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

    // Account Form State
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [college, setCollege] = useState("");
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Appearance State
    const [theme, setTheme] = useState("dark");
    const [density, setDensity] = useState("comfortable");
    const [animations, setAnimations] = useState("full");
    const [fontSize, setFontSize] = useState("default");

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
                addToast("Settings updated successfully!", "success");
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
        { id: "account", label: "Account Profile", icon: User },
        { id: "appearance", label: "Appearance & Theme", icon: Palette },
        { id: "notifications", label: "Notification Toggles", icon: Bell },
        { id: "privacy", label: "Privacy Rules", icon: Lock },
        { id: "security", label: "Security & Sessions", icon: Shield },
        { id: "blocked", label: "Blocked Users", icon: Ban },
        { id: "control", label: "Account Control", icon: AlertTriangle },
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

                    <main className="main-content flex-col items-center px-4 py-8">
                        <div className="w-full max-w-[800px] mx-auto space-y-6">

                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-black tracking-tight">Egram 2.0 Settings</h1>
                                    <p className="text-xs text-[var(--text-light)] font-medium mt-0.5">
                                        Manage your account, privacy, theme & security preferences
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsLogoutModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-black hover:bg-red-500/20 transition-all"
                                >
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>

                            {/* Settings Container (Responsive Grid) */}
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                                {/* Navigation Panel (Desktop & Mobile List) */}
                                <div className={`md:col-span-4 ${mobileView === "detail" ? "hidden md:block" : "block"}`}>
                                    <div className="glass rounded-3xl p-3 border border-[var(--card-border)] space-y-1">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = activeTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => {
                                                        setActiveTab(tab.id as any);
                                                        setMobileView("detail");
                                                    }}
                                                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-black transition-all ${
                                                        isActive
                                                            ? "bg-[var(--primary)] text-white shadow-lg shadow-purple-500/20"
                                                            : "text-zinc-400 hover:text-white hover:bg-[var(--accent-bg)]"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Icon className="w-4 h-4" />
                                                        <span>{tab.label}</span>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 opacity-50 md:hidden" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Content Panel (Desktop & Mobile Detail) */}
                                <div className={`md:col-span-8 ${mobileView === "list" ? "hidden md:block" : "block"}`}>
                                    <div className="glass rounded-3xl p-6 border border-[var(--card-border)] relative">
                                        
                                        {/* Mobile Back Button */}
                                        <button
                                            onClick={() => setMobileView("list")}
                                            className="md:hidden flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] mb-4"
                                        >
                                            <ArrowLeft className="w-4 h-4" /> Back to Settings List
                                        </button>

                                        {/* TABS CONTENT */}

                                        {/* 1. Account Settings */}
                                        {activeTab === "account" && (
                                            <div className="space-y-4">
                                                <h2 className="text-xl font-black">Account Profile</h2>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Full Name</label>
                                                        <input
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            className="w-full mt-1 p-3 rounded-xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-sm font-bold focus:outline-none focus:border-[var(--primary)]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Username</label>
                                                        <input
                                                            value={username}
                                                            onChange={(e) => setUsername(e.target.value)}
                                                            className="w-full mt-1 p-3 rounded-xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-sm font-bold focus:outline-none focus:border-[var(--primary)]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Bio</label>
                                                        <textarea
                                                            value={bio}
                                                            onChange={(e) => setBio(e.target.value)}
                                                            className="w-full mt-1 p-3 rounded-xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-sm font-medium focus:outline-none focus:border-[var(--primary)] resize-none h-20"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">College / Uni</label>
                                                            <input
                                                                value={college}
                                                                onChange={(e) => setCollege(e.target.value)}
                                                                placeholder="e.g. IIT Bombay"
                                                                className="w-full mt-1 p-3 rounded-xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Branch & Year</label>
                                                            <input
                                                                value={branch}
                                                                onChange={(e) => setBranch(e.target.value)}
                                                                placeholder="e.g. CSE - 3rd Year"
                                                                className="w-full mt-1 p-3 rounded-xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-xs font-bold focus:outline-none focus:border-[var(--primary)]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={handleSaveAccount}
                                                        disabled={isSaving}
                                                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-xs font-black shadow-lg shadow-purple-500/30 hover:opacity-90 disabled:opacity-50 mt-4"
                                                    >
                                                        <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Save Account Changes"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. Appearance */}
                                        {activeTab === "appearance" && (
                                            <div className="space-y-6">
                                                <h2 className="text-xl font-black">Appearance & UI Customization</h2>
                                                <div className="space-y-4">
                                                    <div>
                                                        <p className="text-xs font-black uppercase text-zinc-400 mb-2">Theme Mode</p>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { id: "dark", label: "Dark", icon: Moon },
                                                                { id: "light", label: "Light", icon: Sun },
                                                                { id: "system", label: "System", icon: Monitor },
                                                            ].map((t) => {
                                                                const Icon = t.icon;
                                                                return (
                                                                    <button
                                                                        key={t.id}
                                                                        onClick={() => {
                                                                            setTheme(t.id);
                                                                            addToast(`Theme set to ${t.label}`, "info");
                                                                        }}
                                                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-black ${
                                                                            theme === t.id
                                                                                ? "border-[var(--primary)] bg-purple-500/10 text-[var(--primary)]"
                                                                                : "border-[var(--card-border)] bg-[var(--accent-bg)] text-zinc-400"
                                                                        }`}
                                                                    >
                                                                        <Icon className="w-4 h-4" /> {t.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-black uppercase text-zinc-400 mb-2">Interface Density</p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {["comfortable", "compact"].map((d) => (
                                                                <button
                                                                    key={d}
                                                                    onClick={() => setDensity(d)}
                                                                    className={`p-3 rounded-xl border text-xs font-black capitalize ${
                                                                        density === d
                                                                            ? "border-[var(--primary)] bg-purple-500/10 text-[var(--primary)]"
                                                                            : "border-[var(--card-border)] bg-[var(--accent-bg)] text-zinc-400"
                                                                    }`}
                                                                >
                                                                    {d}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 3. Notifications */}
                                        {activeTab === "notifications" && (
                                            <div className="space-y-4">
                                                <h2 className="text-xl font-black">Notification Preferences</h2>
                                                <div className="space-y-3">
                                                    {Object.entries(notifications).map(([key, val]) => (
                                                        <div key={key} className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                                                            <span className="text-xs font-black capitalize">{key} Notifications</span>
                                                            <button
                                                                onClick={() => setNotifications((prev) => ({ ...prev, [key]: !val }))}
                                                                className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                                                                    val ? "bg-[var(--primary)]" : "bg-zinc-700"
                                                                }`}
                                                            >
                                                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${val ? "translate-x-5" : "translate-x-0"}`} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 4. Privacy Rules */}
                                        {activeTab === "privacy" && (
                                            <div className="space-y-4">
                                                <h2 className="text-xl font-black">Privacy Rules</h2>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                                                        <div>
                                                            <p className="text-xs font-black">Private Account</p>
                                                            <p className="text-[10px] text-[var(--text-light)]">Only followers can see your posts and activity</p>
                                                        </div>
                                                        <button
                                                            onClick={() => setPrivacy((prev) => ({ ...prev, isPrivate: !prev.isPrivate }))}
                                                            className={`w-11 h-6 rounded-full transition-colors relative p-1 ${
                                                                privacy.isPrivate ? "bg-[var(--primary)]" : "bg-zinc-700"
                                                            }`}
                                                        >
                                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${privacy.isPrivate ? "translate-x-5" : "translate-x-0"}`} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 5. Security & Sessions */}
                                        {activeTab === "security" && (
                                            <div className="space-y-4">
                                                <h2 className="text-xl font-black">Security & Active Sessions</h2>
                                                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                                    <p className="text-xs font-black">✔ Current Session Active</p>
                                                    <p className="text-[11px] mt-1 font-medium text-zinc-300">
                                                        Logged in as: {user.email} (Connected via Google OAuth / Email Auth)
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* 6. Blocked Users */}
                                        {activeTab === "blocked" && (
                                            <div className="space-y-4">
                                                <h2 className="text-xl font-black">Blocked Users</h2>
                                                <div className="text-center py-10 rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--accent-bg)]">
                                                    <UserX className="w-8 h-8 mx-auto text-zinc-500 opacity-40 mb-1" />
                                                    <p className="text-xs font-bold text-zinc-400">No blocked users.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* 7. Account Control */}
                                        {activeTab === "control" && (
                                            <div className="space-y-4">
                                                <h2 className="text-xl font-black text-red-500">Account Danger Zone</h2>
                                                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
                                                    <div>
                                                        <p className="text-xs font-black text-red-400">Deactivate / Delete Account</p>
                                                        <p className="text-[11px] text-zinc-400 mt-0.5">
                                                            Permanently delete your profile, posts, comments and student data.
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setIsDeleteModalOpen(true)}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Delete Account
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>

                            </div>

                        </div>
                    </main>

                    {/* Logout Modal */}
                    {isLogoutModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                            <div className="glass rounded-3xl p-6 max-w-sm w-full border border-[var(--card-border)] text-center space-y-4">
                                <LogOut className="w-10 h-10 mx-auto text-purple-400" />
                                <h3 className="text-lg font-black">Confirm Sign Out</h3>
                                <p className="text-xs text-[var(--text-light)]">Are you sure you want to log out of Egram 2.0?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300">
                                        Cancel
                                    </button>
                                    <button onClick={handleLogout} className="flex-1 py-2.5 rounded-xl bg-[var(--primary)] text-xs font-black text-white shadow-lg">
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Account Modal */}
                    {isDeleteModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="glass rounded-3xl p-6 max-w-sm w-full border border-red-500/30 text-center space-y-4">
                                <AlertTriangle className="w-10 h-10 mx-auto text-red-500" />
                                <h3 className="text-lg font-black text-red-400">Delete Account</h3>
                                <p className="text-xs text-zinc-300 leading-relaxed">
                                    This action is permanent. Type <span className="font-bold text-white font-mono">DELETE MY ACCOUNT</span> below to confirm.
                                </p>
                                <input
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    placeholder="DELETE MY ACCOUNT"
                                    className="w-full p-3 rounded-xl bg-[var(--accent-bg)] border border-red-500/40 text-center text-xs font-bold focus:outline-none"
                                />
                                <div className="flex gap-3">
                                    <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300">
                                        Cancel
                                    </button>
                                    <button onClick={handleDeleteAccount} className="flex-1 py-2.5 rounded-xl bg-red-600 text-xs font-black text-white">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <RightSidebar user={user} handleSignOut={() => auth.signOut()} getInitials={getInitials} />
                    <MobileNav onOpenCreatePost={() => setIsPostModalOpen(true)} onOpenCreateMeet={() => setIsModalOpen(true)} currentUserId={user.uid} />

                    <CreateMeetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} getInitials={getInitials} />
                    <CreatePostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} user={user} />
                </div>
            )}
        </>
    );
}
