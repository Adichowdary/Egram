"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, MessageSquare, Bell, Menu, Compass, BookOpen, Users, User, Settings, PlusSquare, Video, LogOut, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { useTheme } from "next-themes";

interface MobileNavProps {
    onOpenCreatePost?: () => void;
    onOpenCreateMeet?: () => void;
    currentUserId?: string;
}

export function MobileNav({ onOpenCreatePost, onOpenCreateMeet, currentUserId }: MobileNavProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
            {/* Main Bottom Navigation Bar */}
            <nav 
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-[var(--card-border)] px-4 py-2 flex items-center justify-between shadow-2xl"
                style={{ background: "rgba(18, 18, 24, 0.96)" }}
            >
                {/* 1. Home */}
                <Link
                    href="/"
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[52px] min-h-[48px] ${
                        pathname === "/" ? "text-[var(--primary)] scale-110 font-black" : "text-zinc-400 hover:text-white"
                    }`}
                >
                    <Home className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[11px] font-bold mt-1 tracking-tight">Home</span>
                </Link>

                {/* 2. Search */}
                <Link
                    href="/search"
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[52px] min-h-[48px] ${
                        pathname === "/search" ? "text-[var(--primary)] scale-110 font-black" : "text-zinc-400 hover:text-white"
                    }`}
                >
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[11px] font-bold mt-1 tracking-tight">Search</span>
                </Link>

                {/* 3. Messages */}
                <Link
                    href="/messages"
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[52px] min-h-[48px] ${
                        pathname === "/messages" ? "text-[var(--primary)] scale-110 font-black" : "text-zinc-400 hover:text-white"
                    }`}
                >
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[11px] font-bold mt-1 tracking-tight">Messages</span>
                </Link>

                {/* 4. Notifications / Alerts */}
                <button
                    onClick={() => setIsNotificationsOpen(true)}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl transition-all text-zinc-400 hover:text-white min-w-[52px] min-h-[48px]"
                >
                    <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[11px] font-bold mt-1 tracking-tight">Alerts</span>
                </button>

                {/* 5. More (Stack Drawer Trigger) */}
                <button
                    onClick={() => setIsMoreOpen(true)}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all min-w-[52px] min-h-[48px] ${
                        isMoreOpen ? "text-[var(--primary)] scale-110 font-black" : "text-zinc-400 hover:text-white"
                    }`}
                >
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-[11px] font-bold mt-1 tracking-tight">More</span>
                </button>
            </nav>

            {/* Notifications Modal */}
            <NotificationsPanel 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
                user={auth?.currentUser || null} 
            />

            {/* Bottom Sheet Drawer for "More" Stack */}
            <AnimatePresence>
                {isMoreOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMoreOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                        />

                        {/* Sheet Container */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 24, stiffness: 280 }}
                            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--card-bg)] border-t border-[var(--card-border)] rounded-t-[36px] p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-1.5 bg-zinc-700 rounded-full mx-auto" />
                                    <h3 className="text-lg font-black tracking-tight text-[var(--text-dark)]">Menu & Options</h3>
                                </div>
                                <button
                                    onClick={() => setIsMoreOpen(false)}
                                    className="p-2.5 rounded-full bg-[var(--accent-bg)] text-zinc-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Action Buttons: Create Post & Create Meet */}
                            <div className="grid grid-cols-2 gap-3">
                                {onOpenCreatePost && (
                                    <button
                                        onClick={() => {
                                            setIsMoreOpen(false);
                                            onOpenCreatePost();
                                        }}
                                        className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-black text-sm shadow-xl active:scale-95 transition-all min-h-[48px]"
                                    >
                                        <PlusSquare className="w-5 h-5" /> Create Post
                                    </button>
                                )}
                                {onOpenCreateMeet && (
                                    <button
                                        onClick={() => {
                                            setIsMoreOpen(false);
                                            onOpenCreateMeet();
                                        }}
                                        className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-sm shadow-xl active:scale-95 transition-all min-h-[48px]"
                                    >
                                        <Video className="w-5 h-5" /> Create Meet
                                    </button>
                                )}
                            </div>

                            {/* Stacked Navigation Links */}
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                {stackedItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href || (item.label === "My Profile" && pathname.startsWith("/profile"));
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setIsMoreOpen(false)}
                                            className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all min-h-[52px] ${
                                                isActive
                                                    ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-black"
                                                    : "bg-[var(--accent-bg)] border-[var(--card-border)] text-[var(--text-dark)] hover:bg-zinc-800 active:scale-98"
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 ${item.color}`} />
                                            <span className="text-sm font-bold">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Footer Options: Theme Toggle & Logout */}
                            <div className="pt-4 border-t border-[var(--card-border)] grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                    className="flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] font-bold text-sm text-[var(--text-dark)] hover:bg-zinc-800 transition-all min-h-[48px]"
                                >
                                    {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center justify-center gap-2.5 py-4 px-5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-base hover:bg-red-500/20 transition-all min-h-[54px] shadow-sm cursor-pointer"
                                >
                                    <LogOut className="w-5.5 h-5.5" /> Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
