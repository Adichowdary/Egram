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
            title: "FEEDS & DISCOVERY",
            items: [
                { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
                { href: "/discover", icon: <Compass className="w-5 h-5" />, label: "Discover Hub" },
                { href: "/study", icon: <BookOpen className="w-5 h-5" />, label: "Study Mode" },
                { href: "/circles", icon: <UsersIcon className="w-5 h-5" />, label: "Student Circles" },
                { href: "/search", icon: <Search className="w-5 h-5" />, label: "Search" },
            ]
        },
        {
            title: "COMMUNICATION",
            items: [
                { href: "/messages", icon: <MessageSquare className="w-5 h-5" />, label: "Messages" },
            ]
        }
    ];

    return (
        <aside className="hidden md:flex sidebar glass border-r border-[var(--border)] backdrop-blur-2xl">
            {/* Branding Header */}
            <div className="nav-brand flex items-center justify-between px-3 mb-5">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent">
                        Egram.
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        v2.0
                    </span>
                </Link>
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-1">
                {navSections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <span className="px-3 text-[10px] font-extrabold tracking-wider uppercase text-[var(--muted)] opacity-80 block">
                            {section.title}
                        </span>
                        {section.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link href={item.href} key={item.href}>
                                    <motion.div
                                        whileHover={{ x: 3 }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                        className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            isActive
                                                ? "text-indigo-400 bg-indigo-500/15 border border-indigo-500/20 shadow-xs"
                                                : "text-[var(--muted)] hover:text-[var(--text-dark)] hover:bg-[var(--surface-2)]"
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebarActiveIndicator"
                                                className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </motion.div>
                                </Link>
                            );
                        })}
                    </div>
                ))}

                {/* Interactive Action Buttons Section */}
                <div className="space-y-1 pt-2 border-t border-[var(--border)]">
                    <span className="px-3 text-[10px] font-extrabold tracking-wider uppercase text-[var(--muted)] opacity-80 block">
                        QUICK ACTIONS
                    </span>

                    {/* Notifications Trigger */}
                    <motion.div
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setIsNotificationsOpen(true); setUnreadCount(0); }}
                        className="cursor-pointer relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--text-dark)] hover:bg-[var(--surface-2)] transition-all"
                    >
                        <Bell className="w-5 h-5 text-indigo-400" />
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <div className="ml-auto px-2 py-0.5 bg-rose-500 rounded-full text-[10px] font-black text-white border border-[var(--surface)] animate-pulse">
                                {unreadCount}
                            </div>
                        )}
                    </motion.div>

                    {/* Create Post */}
                    <motion.div
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsPostModalOpen?.(true)}
                        className="cursor-pointer flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--text-dark)] hover:bg-[var(--surface-2)] transition-all"
                    >
                        <PlusSquare className="w-5 h-5 text-indigo-400" />
                        <span>Create Post</span>
                    </motion.div>

                    {/* Create Meet */}
                    <motion.div
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsModalOpen(true)}
                        className="cursor-pointer flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[var(--muted)] hover:text-[var(--text-dark)] hover:bg-[var(--surface-2)] transition-all"
                    >
                        <Video className="w-5 h-5 text-purple-400" />
                        <span>Create Meet</span>
                    </motion.div>
                </div>
            </div>

            {/* User Account Bottom Card */}
            <div className="pt-3 mt-auto border-t border-[var(--border)] space-y-2">
                <Link href={`/profile/${user.uid}`}>
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:border-indigo-500/30 transition-all cursor-pointer group">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-indigo-500/40 p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0">
                            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-black text-xs text-indigo-400 bg-[var(--background)]">
                                {userPhoto ? (
                                    <img src={userPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(userName)
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-xs font-extrabold truncate text-[var(--text-dark)] group-hover:text-indigo-400 transition-colors">
                                {userName}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-[var(--muted)]">
                                <span className="truncate">Learner Profile</span>
                                <ShieldCheck className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Theme Switcher Button */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-xs font-bold text-[var(--text-dark)] hover:border-indigo-500/30 transition-all cursor-pointer"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle theme"
                >
                    <div className="flex items-center gap-2">
                        {mounted && theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                        <span>{mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </div>
                    <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">{theme === "dark" ? "DARK" : "LIGHT"}</span>
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
