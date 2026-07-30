"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, MessageSquare, Bell, Menu, Compass, BookOpen, Users, User, Settings, PlusSquare, Video, LogOut, X, Sun, Moon, Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useTheme } from "next-themes";

interface MobileNavProps {
    onOpenCreatePost?: () => void;
    onOpenCreateMeet?: () => void;
    onOpenCreateStory?: () => void;
    currentUserId?: string;
}

export function MobileNav({ onOpenCreatePost, onOpenCreateMeet, onOpenCreateStory, currentUserId }: MobileNavProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const navTabs = [
        { href: "/", label: "Home", icon: Home },
        { href: "/search", label: "Search", icon: Search },
        { href: "/messages", label: "Chats", icon: MessageSquare },
        { href: "/discover", label: "Discover", icon: Compass },
    ];

    const gridItems = [
        { href: "/discover", label: "Discover Hub", icon: Compass, color: "text-amber-500" },
        { href: "/study", label: "Study Mode", icon: BookOpen, color: "text-purple-500" },
        { href: "/circles", label: "Student Circles", icon: Users, color: "text-pink-500" },
        { href: currentUserId ? `/profile/${currentUserId}` : "/profile", label: "My Profile", icon: User, color: "text-blue-500" },
    ];

    const handleSignOut = async () => {
        setIsMoreOpen(false);
        await auth.signOut();
        router.push("/login");
    };

    return (
        <>
            {/* 1. Mobile Top Glass Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass-header px-4 py-3 flex items-center justify-between shadow-sm">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        Egram.
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    {onOpenCreatePost && (
                        <button
                            onClick={onOpenCreatePost}
                            className="p-2.5 rounded-full text-blue-500 hover:bg-blue-500/20 active:scale-95 transition-all cursor-pointer"
                            style={{ backgroundColor: "var(--primary-bg)" }}
                            aria-label="Create Post"
                        >
                            <PlusSquare className="w-5 h-5" />
                        </button>
                    )}

                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="p-2.5 rounded-full border hover:opacity-80 active:scale-95 transition-all relative cursor-pointer"
                        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-dark)" }}
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    </button>

                    <Link
                        href="/messages"
                        className="p-2.5 rounded-full border hover:opacity-80 active:scale-95 transition-all cursor-pointer"
                        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-dark)" }}
                        aria-label="Messages"
                    >
                        <Send className="w-5 h-5" />
                    </Link>
                </div>
            </header>

            {/* 2. Floating Bottom Glass Navigation Bar */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
                <nav className="glass-nav rounded-full px-3 py-2 flex items-center justify-around shadow-2xl border backdrop-blur-2xl" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                    {navTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all min-w-[54px] min-h-[46px] ${
                                    isActive ? "text-blue-500 font-bold" : "hover:text-[var(--text-dark)]"
                                }`}
                                style={{ color: isActive ? "var(--primary)" : "var(--text-light)" }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabPill"
                                        className="absolute inset-0 rounded-full -z-10"
                                        style={{ backgroundColor: "var(--primary-bg)" }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                                <span className="text-[10px] font-semibold mt-0.5 tracking-tight">{tab.label}</span>
                            </Link>
                        );
                    })}

                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all min-w-[54px] min-h-[46px] cursor-pointer ${
                            isMoreOpen ? "text-blue-500 font-bold" : "hover:text-[var(--text-dark)]"
                        }`}
                        style={{ color: isMoreOpen ? "var(--primary)" : "var(--text-light)" }}
                    >
                        {isMoreOpen && (
                            <motion.div
                                layoutId="activeTabPill"
                                className="absolute inset-0 rounded-full -z-10"
                                style={{ backgroundColor: "var(--primary-bg)" }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <Menu className="w-5 h-5" />
                        <span className="text-[10px] font-semibold mt-0.5 tracking-tight">More</span>
                    </button>
                </nav>
            </div>

            {/* Notifications Modal */}
            <NotificationsPanel 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
                user={auth?.currentUser || null} 
            />

            {/* Bottom Sheet Drawer for "Menu & Options" */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 md:hidden"
                        />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t rounded-t-[32px] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                            style={{ backgroundColor: "var(--background)", borderColor: "var(--card-border)" }}
                        >
                            {/* Drag Handle Bar */}
                            <div className="w-12 h-1 rounded-full mx-auto" style={{ backgroundColor: "var(--text-light)", opacity: 0.3 }} />

                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--card-border)" }}>
                                <h3 className="text-lg font-black tracking-tight" style={{ color: "var(--text-dark)" }}>Menu & Options</h3>
                                <button
                                    onClick={() => setIsMoreOpen(false)}
                                    className="p-1.5 rounded-full transition-all cursor-pointer"
                                    style={{ color: "var(--text-light)" }}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Primary Action Buttons */}
                            <div className="space-y-3">
                                {/* Create Study Room */}
                                <button
                                    onClick={() => {
                                        setIsMoreOpen(false);
                                        if (onOpenCreateMeet) onOpenCreateMeet();
                                    }}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-400 text-white shadow-xl active:scale-98 transition-all border border-cyan-400/30 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white flex-shrink-0">
                                            <Video className="w-6 h-6" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-base font-black leading-tight">Create Study Room</span>
                                            <span className="text-xs text-white/90 font-medium mt-0.5">Host live video sessions with friends</span>
                                        </div>
                                    </div>
                                    <Sparkles className="w-5 h-5 text-cyan-100 animate-pulse flex-shrink-0" />
                                </button>

                                {/* Create Post */}
                                <button
                                    onClick={() => {
                                        setIsMoreOpen(false);
                                        if (onOpenCreatePost) onOpenCreatePost();
                                    }}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white shadow-xl active:scale-98 transition-all border border-pink-400/30 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white flex-shrink-0">
                                            <PlusSquare className="w-6 h-6" />
                                        </div>
                                        <span className="text-base font-black">Create Post</span>
                                    </div>
                                </button>
                            </div>

                            {/* 2x2 Navigation Cards Grid */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                {gridItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href || (item.label === "My Profile" && pathname.startsWith("/profile"));
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setIsMoreOpen(false)}
                                            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                                                isActive
                                                    ? "bg-blue-500/15 border-blue-500 text-blue-500 font-bold"
                                                    : ""
                                            }`}
                                            style={{
                                                backgroundColor: isActive ? undefined : "var(--card-bg)",
                                                borderColor: isActive ? undefined : "var(--card-border)",
                                                color: isActive ? undefined : "var(--text-dark)",
                                            }}
                                        >
                                            <Icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                                            <span className="text-sm font-bold truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Settings Row */}
                            <Link
                                href="/settings"
                                onClick={() => setIsMoreOpen(false)}
                                className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all"
                                style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-dark)" }}
                            >
                                <Settings className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                <span className="text-sm font-bold">Settings</span>
                            </Link>

                            {/* Light Mode & Sign Out Bottom Row */}
                            <div className="pt-2 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-bold text-xs hover:opacity-80 transition-all cursor-pointer"
                                    style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-dark)" }}
                                >
                                    {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
                                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                                </button>

                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold text-xs hover:bg-rose-500/20 transition-all cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
