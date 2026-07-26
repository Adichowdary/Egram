"use client";
import { Home, Search, Compass, MessageSquare, PlusSquare, Moon, Sun, User as UserIcon, Bell, Video, BookOpen, Users as UsersIcon, Settings as SettingsIcon } from "lucide-react";
import { User } from "firebase/auth";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { NotificationsPanel } from "./NotificationsPanel";
import { useStreak } from "@/hooks/useStreak";

interface SidebarProps {
    user: User;
    setIsModalOpen: (val: boolean) => void;
    setIsPostModalOpen?: (val: boolean) => void;
    getInitials: (name: string | null) => string;
}

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const sidebarAvatarCache = new Map<string, string>();

export function Sidebar({ user, setIsModalOpen, setIsPostModalOpen, getInitials }: SidebarProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const pathname = usePathname();

    // Call streak hook to register login and maintain daily streak
    useStreak(user);

    const [userPhoto, setUserPhoto] = useState<string | null>(() => user?.uid ? sidebarAvatarCache.get(user.uid) || user?.photoURL || null : user?.photoURL || null);

    const fetchSidebarProfile = async () => {
        if (!user?.uid) return;
        try {
            const res = await fetch(`/api/users/${user.uid}`);
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

        const handleUpdate = () => fetchSidebarProfile();
        window.addEventListener("userProfileUpdated", handleUpdate);

        return () => {
            clearInterval(pollInterval);
            window.removeEventListener("userProfileUpdated", handleUpdate);
        };
    }, [user?.uid]);

    const navItems = [
        { href: "/", icon: <Home />, label: "Home" },
        { href: "/discover", icon: <Compass />, label: "Discover" },
        { href: "/study", icon: <BookOpen />, label: "Study Mode" },
        { href: "/circles", icon: <UsersIcon />, label: "Circles" },
        { href: "/search", icon: <Search />, label: "Search" },
        { href: "/messages", icon: <MessageSquare />, label: "Messages" },
    ];

    return (
        <aside className="sidebar glass">
            <div className="nav-brand text-[var(--text-dark)] select-none">Egram.</div>

            <ul className="nav-links">
                {navItems.map((item) => (
                    <Link href={item.href} key={item.href}>
                        <motion.li 
                            whileHover={{ scale: 1.02, x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            className={pathname === item.href ? "active" : ""}
                        >
                            {item.icon} <span>{item.label}</span>
                        </motion.li>
                    </Link>
                ))}

                <motion.li 
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setIsNotificationsOpen(true); setUnreadCount(0); }} 
                    className="cursor-pointer relative"
                >
                    <Bell /> <span>Notifications</span>
                    {unreadCount > 0 && (
                        <div className="absolute top-2 left-6 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border-2 border-[var(--card-bg)]">
                            {unreadCount}
                        </div>
                    )}
                </motion.li>

                <motion.li 
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPostModalOpen?.(true)} 
                    className="cursor-pointer"
                >
                    <PlusSquare /> <span>Create Post</span>
                </motion.li>
                
                <motion.li 
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)} 
                    className="cursor-pointer"
                >
                    <Video /> <span>Create Meet</span>
                </motion.li>

                <Link href={`/profile/${user.uid}`}>
                    <motion.li 
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className={pathname.includes(`/profile/${user.uid}`) ? "active" : ""}
                    >
                        <div className="avatar-small">
                            {userPhoto || user.photoURL ? (
                                <img src={userPhoto || user.photoURL || ""} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                getInitials(user.displayName || user.email)
                            )}
                        </div>
                        <span>Profile</span>
                    </motion.li>
                </Link>

                <Link href="/settings">
                    <motion.li 
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        className={pathname === "/settings" ? "active" : ""}
                    >
                        <SettingsIcon /> <span>Settings</span>
                    </motion.li>
                </Link>
            </ul>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="icon-btn mt-auto flex items-center gap-4 p-4 text-left w-full hover:bg-[var(--card-border)] rounded-lg transition-colors"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
            >
                {mounted && theme === "dark" ? <Sun /> : <Moon />} <span>Theme</span>
            </motion.button>

            <NotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                user={user}
            />
        </aside>
    );
}
