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

    const stackedItems = [
        { href: "/discover", label: "Discover Hub", icon: Compass, color: "text-orange-400" },
        { href: "/study", label: "Study Mode", icon: BookOpen, color: "text-purple-400" },
        { href: "/circles", label: "Student Circles", icon: Users, color: "text-pink-400" },
        { href: currentUserId ? `/profile/${currentUserId}` : "/profile", label: "My Profile", icon: User, color: "text-blue-400" },
        { href: "/settings", label: "Settings", icon: Settings, color: "text-emerald-400" },
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
                    {/* Create Action trigger */}
                    {onOpenCreatePost && (
                        <button
                            onClick={onOpenCreatePost}
                            className="p-2.5 rounded-full bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 active:scale-95 transition-all"
                            aria-label="Create Post"
                        >
                            <PlusSquare className="w-5 h-5" />
                        </button>
                    )}

                    {/* Notifications Button */}
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="p-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-dark)] hover:opacity-80 active:scale-95 transition-all relative"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    </button>

                    {/* Direct Messages Shortcut */}
                    <Link
                        href="/messages"
                        className="p-2.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-dark)] hover:opacity-80 active:scale-95 transition-all"
                        aria-label="Messages"
                    >
                        <Send className="w-5 h-5" />
                    </Link>
                </div>
            </header>

            {/* 2. Floating Bottom Glass Navigation Bar */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
                <nav className="glass-nav rounded-full px-3 py-2 flex items-center justify-around shadow-2xl border border-[var(--card-border)] backdrop-blur-2xl">
                    {navTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = pathname === tab.href;

                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all min-w-[54px] min-h-[46px] ${
                                    isActive ? "text-indigo-500 font-bold" : "text-slate-400 hover:text-[var(--text-dark)]"
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabPill"
                                        className="absolute inset-0 bg-indigo-500/15 rounded-full -z-10"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                                <span className="text-[10px] font-semibold mt-0.5 tracking-tight">{tab.label}</span>
                            </Link>
                        );
                    })}

                    {/* Menu/More Drawer Button */}
                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all min-w-[54px] min-h-[46px] ${
                            isMoreOpen ? "text-indigo-500 font-bold" : "text-slate-400 hover:text-[var(--text-dark)]"
                        }`}
                    >
                        {isMoreOpen && (
                            <motion.div
                                layoutId="activeTabPill"
                                className="absolute inset-0 bg-indigo-500/15 rounded-full -z-10"
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

            {/* Bottom Sheet Drawer for "More" Navigation */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 md:hidden"
                        />

                        {/* Sheet Container */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 26, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--card-bg)] border-t border-[var(--card-border)] rounded-t-[36px] p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto backdrop-blur-2xl"
                        >
                            {/* Handle Bar */}
                            <div className="w-12 h-1.5 bg-slate-400/30 rounded-full mx-auto" />

                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                                <h3 className="text-lg font-black tracking-tight text-[var(--text-dark)]">Menu & Quick Actions</h3>
                                <button
                                    onClick={() => setIsMoreOpen(false)}
                                    className="p-2 rounded-full bg-[var(--accent-bg)] text-slate-400 hover:text-[var(--text-dark)] transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Quick Action Buttons */}
                            <div className="flex flex-col gap-3">
                                {onOpenCreateStory && (
                                    <button
                                        onClick={() => {
                                            setIsMoreOpen(false);
                                            onOpenCreateStory();
                                        }}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black shadow-lg active:scale-98 transition-all border border-amber-400/30 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white">
                                                <Sparkles className="w-5 h-5 animate-pulse" />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-sm font-black">Create Story</span>
                                                <span className="text-xs text-amber-100/90 font-medium">Post photo or video status</span>
                                            </div>
                                        </div>
                                        <PlusSquare className="w-5 h-5 text-amber-200" />
                                    </button>
                                )}

                                {onOpenCreateMeet && (
                                    <button
                                        onClick={() => {
                                            setIsMoreOpen(false);
                                            onOpenCreateMeet();
                                        }}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white font-black shadow-lg active:scale-98 transition-all border border-cyan-400/30 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white">
                                                <Video className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-sm font-black">Create Study Room</span>
                                                <span className="text-xs text-cyan-100/90 font-medium">Host live video study sessions</span>
                                            </div>
                                        </div>
                                        <Sparkles className="w-5 h-5 text-cyan-200 animate-pulse" />
                                    </button>
                                )}
                            </div>

                            {/* Stacked Navigation Grid */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                {stackedItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href || (item.label === "My Profile" && pathname.startsWith("/profile"));
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setIsMoreOpen(false)}
                                            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                                                isActive
                                                    ? "bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold"
                                                    : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-dark)] hover:border-indigo-500/30"
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 ${item.color}`} />
                                            <span className="text-sm font-semibold">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Bottom Controls: Theme Switch & Logout */}
                            <div className="pt-4 border-t border-[var(--card-border)] grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] font-bold text-xs text-[var(--text-dark)] hover:opacity-80 transition-all cursor-pointer"
                                >
                                    {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
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
