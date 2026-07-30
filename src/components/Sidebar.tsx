"use client";

import { Home, Search, Compass, MessageSquare, PlusSquare, Moon, Sun, Bell, Video, BookOpen, Users as UsersIcon, Settings as SettingsIcon } from "lucide-react";
import { User } from "firebase/auth";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { NotificationsPanel } from "./NotificationsPanel";
import { useStreak } from "@/hooks/useStreak";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface SidebarProps {
    user: User;
    setIsModalOpen: (val: boolean) => void;
    setIsPostModalOpen?: (val: boolean) => void;
    getInitials: (name: string | null) => string;
}

const sidebarAvatarCache = new Map<string, string>();

export function Sidebar({ user, setIsModalOpen, setIsPostModalOpen, getInitials }: SidebarProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();

    useStreak(user);

    const [userPhoto, setUserPhoto] = useState<string | null>(() => 
        user?.uid ? sidebarAvatarCache.get(user.uid) || user?.photoURL || null : user?.photoURL || null
    );

    const fetchSidebarProfile = async () => {
        if (!user?.uid) return;
        try {
            const res = await fetch(`/api/users/${user.uid}?t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                if (data.avatarUrl) {
                    sidebarAvatarCache.set(user.uid, data.avatarUrl);
                    setUserPhoto(data.avatarUrl);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

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
            setUserPhoto(user.photoURL || null);
            fetchSidebarProfile();
            checkUnreadNotifications();
        }

        const pollInterval = setInterval(checkUnreadNotifications, 30000);

        const handleUpdate = (e: Event) => {
            const customEvt = e as CustomEvent;
            if (customEvt?.detail?.avatarUrl) {
                sidebarAvatarCache.set(user.uid, customEvt.detail.avatarUrl);
                setUserPhoto(customEvt.detail.avatarUrl);
            }
            fetchSidebarProfile();
        };
        window.addEventListener("userProfileUpdated", handleUpdate);

        return () => {
            clearInterval(pollInterval);
            window.removeEventListener("userProfileUpdated", handleUpdate);
        };
    }, [user?.uid]);

    const navItems = [
        { href: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
        { href: "/discover", icon: <Compass className="w-5 h-5" />, label: "Discover" },
        { href: "/study", icon: <BookOpen className="w-5 h-5" />, label: "Study Mode" },
        { href: "/circles", icon: <UsersIcon className="w-5 h-5" />, label: "Circles" },
        { href: "/search", icon: <Search className="w-5 h-5" />, label: "Search" },
        { href: "/messages", icon: <MessageSquare className="w-5 h-5" />, label: "Messages" },
    ];

    return (
        <aside className="hidden md:flex sidebar glass border-r border-[var(--card-border)] backdrop-blur-2xl">
            {/* Branding Header */}
            <div className="nav-brand flex items-center justify-between px-2 mb-6">
                <span className="text-2.5xl font-black tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Egram.
                </span>
            </div>

            {/* Main Navigation Links */}
            <ul className="nav-links space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link href={item.href} key={item.href}>
                            <motion.li
                                whileHover={{ scale: 1.02, x: 4 }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className={`relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                                    isActive
                                        ? "text-indigo-500 font-bold bg-indigo-500/10"
                                        : "text-slate-400 hover:text-[var(--text-dark)] hover:bg-[var(--primary-bg)]"
                                }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebarActivePill"
                                        className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                {item.icon}
                                <span>{item.label}</span>
                            </motion.li>
                        </Link>
                    );
                })}

                {/* Notifications trigger */}
                <motion.li
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => { setIsNotificationsOpen(true); setUnreadCount(0); }}
                    className="cursor-pointer relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-[var(--text-dark)] hover:bg-[var(--primary-bg)] transition-all"
                >
                    <Bell className="w-5 h-5" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <div className="ml-auto px-2 py-0.5 bg-rose-500 rounded-full text-[10px] font-black text-white border-2 border-[var(--card-bg)] animate-pulse">
                            {unreadCount}
                        </div>
                    )}
                </motion.li>

                {/* Create Post trigger */}
                <motion.li
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => setIsPostModalOpen?.(true)}
                    className="cursor-pointer flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-[var(--text-dark)] hover:bg-[var(--primary-bg)] transition-all"
                >
                    <PlusSquare className="w-5 h-5 text-indigo-500" />
                    <span>Create Post</span>
                </motion.li>

                {/* Create Meet trigger */}
                <motion.li
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    onClick={() => setIsModalOpen(true)}
                    className="cursor-pointer flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold text-slate-400 hover:text-[var(--text-dark)] hover:bg-[var(--primary-bg)] transition-all"
                >
                    <Video className="w-5 h-5 text-pink-500" />
                    <span>Create Meet</span>
                </motion.li>

                {/* User Profile */}
                <Link href={`/profile/${user.uid}`}>
                    <motion.li
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`cursor-pointer flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                            pathname.includes(`/profile/${user.uid}`)
                                ? "text-indigo-500 font-bold bg-indigo-500/10"
                                : "text-slate-400 hover:text-[var(--text-dark)] hover:bg-[var(--primary-bg)]"
                        }`}
                    >
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-indigo-500/30 flex items-center justify-center bg-indigo-500/10 text-[10px] font-black text-indigo-500">
                            {userPhoto || user.photoURL ? (
                                <img src={userPhoto || user.photoURL || ""} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                getInitials(user.displayName || user.email)
                            )}
                        </div>
                        <span>Profile</span>
                    </motion.li>
                </Link>

                {/* Settings */}
                <Link href="/settings">
                    <motion.li
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className={`cursor-pointer flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                            pathname === "/settings"
                                ? "text-indigo-500 font-bold bg-indigo-500/10"
                                : "text-slate-400 hover:text-[var(--text-dark)] hover:bg-[var(--primary-bg)]"
                        }`}
                    >
                        <SettingsIcon className="w-5 h-5" />
                        <span>Settings</span>
                    </motion.li>
                </Link>
            </ul>

            {/* Theme Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-sm font-semibold text-[var(--text-dark)] hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
            >
                {mounted && theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                <span>{mounted && theme === "dark" ? "Light Theme" : "Dark Theme"}</span>
            </motion.button>

            <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                user={user}
            />
        </aside>
    );
}
