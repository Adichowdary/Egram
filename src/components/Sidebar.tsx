"use client";

import { Home, Search, Compass, MessageSquare, PlusSquare, Moon, Sun, Bell, Video, BookOpen, Users as UsersIcon, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { User } from "firebase/auth";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { NotificationsPanel } from "./NotificationsPanel";
import { useStreak } from "@/hooks/useStreak";
import { useUserProfile } from "@/hooks/useUserProfile";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface SidebarProps {
    user: User;
    setIsModalOpen: (val: boolean) => void;
    setIsPostModalOpen?: (val: boolean) => void;
    getInitials: (name: string | null) => string;
}

export function Sidebar({ user, setIsModalOpen, setIsPostModalOpen, getInitials }: SidebarProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();

    useStreak(user);
    const { userPhoto, userName } = useUserProfile(user);

    const checkUnreadNotifications = () => {
        if (!user?.uid) return;
        fetch(`/api/notifications/${user.uid}`)
            .then(res => res.json())
            .then(data => {
                if (data.notifications) {
                    const unread = data.notifications.filter((n: any) => !n.isRead).length;
                    setUnreadCount(unread);
                }
            })
            .catch(() => {});
    };

    useEffect(() => {
        setMounted(true);
        if (user) {
            checkUnreadNotifications();
        }
        const pollInterval = setInterval(checkUnreadNotifications, 30000);
        return () => clearInterval(pollInterval);
    }, [user?.uid]);

    const navSections = [
        {
            title: "Feeds & Discovery",
            items: [
                { href: "/", icon: <Home className="w-5 h-5 flex-shrink-0" />, label: "Home" },
                { href: "/discover", icon: <Compass className="w-5 h-5 flex-shrink-0" />, label: "Discover Hub" },
                { href: "/study", icon: <BookOpen className="w-5 h-5 flex-shrink-0" />, label: "Study Mode" },
                { href: "/circles", icon: <UsersIcon className="w-5 h-5 flex-shrink-0" />, label: "Student Circles" },
                { href: "/search", icon: <Search className="w-5 h-5 flex-shrink-0" />, label: "Search" },
            ]
        },
        {
            title: "Communication",
            items: [
                { href: "/messages", icon: <MessageSquare className="w-5 h-5 flex-shrink-0" />, label: "Messages" },
            ]
        },
        {
            title: "Account",
            items: [
                { href: "/settings", icon: <SettingsIcon className="w-5 h-5 flex-shrink-0" />, label: "Settings" },
            ]
        }
    ];

    return (
        <aside className="hidden md:flex sidebar border-r border-[var(--border)] bg-[var(--surface)] select-none">
            {/* Branding Header */}
            <div className="flex items-center justify-between px-3 mb-6 shrink-0">
                <Link href="/" className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg p-1">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                        <span className="text-white font-black text-base">E</span>
                    </div>
                    <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent">
                        Egram.
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        v2.0
                    </span>
                </Link>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 space-y-5 overflow-y-auto no-scrollbar pr-1 min-h-0">
                {navSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <span className="px-3.5 text-[11px] font-bold tracking-wider uppercase text-[var(--muted)] opacity-75 block mb-1.5">
                            {section.title}
                        </span>
                        {section.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link href={item.href} key={item.href} className="block focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl outline-none">
                                    <motion.div
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className={`relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${
                                            isActive
                                                ? "text-indigo-400 bg-indigo-500/15 border border-indigo-500/25 shadow-sm"
                                                : "text-[var(--text-light)] hover:text-[var(--text-dark)] hover:bg-[var(--surface-2)]"
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebarActiveIndicator"
                                                className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-indigo-500 rounded-r-full shadow-sm shadow-indigo-500/50"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        {item.icon}
                                        <span className="truncate">{item.label}</span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                ))}

                {/* Interactive Action Buttons Section */}
                <div className="space-y-1.5 pt-3 border-t border-[var(--border)]">
                    <span className="px-3.5 text-[11px] font-bold tracking-wider uppercase text-[var(--muted)] opacity-75 block mb-1.5">
                        Quick Actions
                    </span>

                    {/* Notifications Trigger */}
                    <motion.div
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setIsNotificationsOpen(true); setUnreadCount(0); }}
                        className="cursor-pointer relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-light)] hover:text-[var(--text-dark)] hover:bg-[var(--surface-2)] transition-all min-h-[44px]"
                    >
                        <Bell className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">Notifications</span>
                        {unreadCount > 0 && (
                            <div className="ml-auto px-2 py-0.5 bg-rose-500 rounded-full text-[10px] font-black text-white border border-[var(--surface)] animate-pulse">
                                {unreadCount}
                            </div>
                        )}
                    </motion.div>

                    {/* Create Post */}
                    <motion.div
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsPostModalOpen?.(true)}
                        className="cursor-pointer flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-light)] hover:text-[var(--text-dark)] hover:bg-[var(--surface-2)] transition-all min-h-[44px]"
                    >
                        <PlusSquare className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">Create Post</span>
                    </motion.div>

                    {/* Create Meet */}
                    <motion.div
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsModalOpen(true)}
                        className="cursor-pointer flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[var(--text-light)] hover:text-[var(--text-dark)] hover:bg-[var(--surface-2)] transition-all min-h-[44px]"
                    >
                        <Video className="w-5 h-5 text-purple-400 flex-shrink-0" />
                        <span className="truncate">Create Meet</span>
                    </motion.div>
                </div>
            </div>

            {/* User Account Bottom Card */}
            <div className="shrink-0 pt-4 mt-auto border-t border-[var(--border)] space-y-2.5">
                <Link href={`/profile/${user.uid}`} className="block focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl outline-none">
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-indigo-500/30 transition-all cursor-pointer group min-h-[52px]">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-indigo-500/40 p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0">
                            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-black text-xs text-indigo-400 bg-[var(--background)]">
                                {userPhoto ? (
                                    <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(userName)
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs sm:text-sm font-extrabold truncate text-[var(--text-dark)] group-hover:text-indigo-400 transition-colors">
                                {userName || "Student User"}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] font-medium text-[var(--muted)]">
                                <span className="truncate">Learner Profile</span>
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Theme Switcher Button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text-dark)] hover:border-indigo-500/30 transition-all cursor-pointer min-h-[44px]"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                >
                    <div className="flex items-center gap-2.5">
                        {mounted && theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                        <span className="font-semibold">{mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[var(--surface)] border border-[var(--border)]">
                        {theme === "dark" ? "DARK" : "LIGHT"}
                    </span>
                </motion.button>
            </div>

            <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                user={user}
            />
        </aside>
    );
}
