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
        { href: "/discover", label: "Discover Hub", icon: Compass, color: "text-indigo-400" },
        { href: "/study", label: "Study Mode", icon: BookOpen, color: "text-purple-400" },
        { href: "/circles", label: "Student Circles", icon: Users, color: "text-pink-400" },
        { href: currentUserId ? `/profile/${currentUserId}` : "/profile", label: "My Profile", icon: User, color: "text-blue-400" },
    ];

    const handleSignOut = async () => {
        setIsMoreOpen(false);
        await auth.signOut();
        router.push("/login");
    };

    return (
        <>
            {/* 1. Mobile Sticky Top Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass-header px-4 h-14 flex items-center justify-between shadow-sm">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight leading-none bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent">
                        Egram.
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    {onOpenCreatePost && (
                        <button
                            onClick={onOpenCreatePost}
                            className="p-2.5 rounded-full text-indigo-400 hover:bg-indigo-500/10 active:scale-95 transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center border border-indigo-500/20"
                            style={{ backgroundColor: "var(--surface-2)" }}
                            aria-label="Create Post"
                        >
                            <PlusSquare className="w-5.5 h-5.5" />
                        </button>
                    )}

                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="p-2.5 rounded-full border border-[var(--border)] text-[var(--text-dark)] hover:opacity-80 active:scale-95 transition-all relative cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                        style={{ backgroundColor: "var(--surface)" }}
                        aria-label="Notifications"
                    >
                        <Bell className="w-5.5 h-5.5" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    </button>

                    <Link
                        href="/messages"
                        className="p-2.5 rounded-full border border-[var(--border)] text-[var(--text-dark)] hover:opacity-80 active:scale-95 transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                        style={{ backgroundColor: "var(--surface)" }}
                        aria-label="Messages"
                    >
                        <Send className="w-5.5 h-5.5" />
                    </Link>
                </div>
            </header>

            {/* 2. Floating Bottom Glass Navigation Bar */}
            <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
                <nav 
                    className="glass-nav rounded-[24px] px-3 py-1.5 flex items-center justify-around shadow-2xl border border-[var(--border)]" 
                    style={{ 
                        backgroundColor: "rgba(18, 18, 22, 0.92)",
                        paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))" 
                    }}
                >
                    {navTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all min-w-[58px] min-h-[48px] ${
                                    isActive ? "font-bold" : "hover:text-[var(--text-dark)]"
                                }`}
                                style={{ color: isActive ? "var(--primary)" : "var(--muted)" }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabPill"
                                        className="absolute inset-0 rounded-2xl -z-10"
                                        style={{ backgroundColor: "var(--primary-bg)" }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon className={`w-5.5 h-5.5 ${isActive ? "scale-110" : ""}`} />
                                <span className="text-[11px] font-semibold mt-1 tracking-tight">{tab.label}</span>
                            </Link>
                        );
                    })}

                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all min-w-[58px] min-h-[48px] cursor-pointer ${
                            isMoreOpen ? "font-bold" : "hover:text-[var(--text-dark)]"
                        }`}
                        style={{ color: isMoreOpen ? "var(--primary)" : "var(--muted)" }}
                    >
                        {isMoreOpen && (
                            <motion.div
                                layoutId="activeTabPill"
                                className="absolute inset-0 rounded-2xl -z-10"
                                style={{ backgroundColor: "var(--primary-bg)" }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                        <Menu className="w-5.5 h-5.5" />
                        <span className="text-[11px] font-semibold mt-1 tracking-tight">More</span>
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
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 md:hidden"
                        />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--border)] rounded-t-[28px] p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                            style={{ backgroundColor: "var(--surface)" }}
                        >
                            {/* Drag Handle Bar */}
                            <div className="w-12 h-1.5 rounded-full mx-auto bg-white/20" />

                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                                <h3 className="text-lg font-extrabold tracking-tight" style={{ color: "var(--text-dark)" }}>Menu & Options</h3>
                                <button
                                    onClick={() => setIsMoreOpen(false)}
                                    className="p-2 rounded-full transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--muted)] hover:text-[var(--text-dark)]"
                                >
                                    <X className="w-5.5 h-5.5" />
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
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl active:scale-98 transition-all border border-indigo-400/30 cursor-pointer min-h-[58px]"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-md text-white flex-shrink-0">
                                            <Video className="w-5.5 h-5.5" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-base font-extrabold leading-tight">Create Study Room</span>
                                            <span className="text-xs text-white/80 font-medium mt-0.5">Host live video sessions with friends</span>
                                        </div>
                                    </div>
                                    <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse flex-shrink-0" />
                                </button>

                                {/* Create Post */}
                                <button
                                    onClick={() => {
                                        setIsMoreOpen(false);
                                        if (onOpenCreatePost) onOpenCreatePost();
                                    }}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-dark)] hover:border-indigo-500/40 active:scale-98 transition-all cursor-pointer min-h-[54px]"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 flex-shrink-0">
                                            <PlusSquare className="w-5.5 h-5.5" />
                                        </div>
                                        <span className="text-base font-bold">Create Post</span>
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
                                            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all min-h-[52px] ${
                                                isActive
                                                    ? "bg-indigo-500/15 border-indigo-500 text-indigo-400 font-bold"
                                                    : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-dark)]"
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                                            <span className="text-xs font-bold truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Settings Row */}
                            <Link
                                href="/settings"
                                onClick={() => setIsMoreOpen(false)}
                                className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-dark)] transition-all min-h-[52px]"
                            >
                                <Settings className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                <span className="text-xs font-bold">Settings</span>
                            </Link>

                            {/* Light/Dark Mode & Sign Out Bottom Row */}
                            <div className="pt-1 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] font-bold text-xs hover:opacity-80 transition-all cursor-pointer min-h-[48px]"
                                >
                                    {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
                                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                                </button>

                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-xs hover:bg-rose-500/20 transition-all cursor-pointer min-h-[48px]"
                                >
                                    <LogOut className="w-4.5 h-4.5" />
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
