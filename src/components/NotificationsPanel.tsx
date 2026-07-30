import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { X, Bell, UserPlus, Heart, MessageCircle, FileText, CheckCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

interface Notification {
    _id: string;
    type: 'follow' | 'like' | 'comment' | 'mention' | 'message' | 'group_message';
    sourceUserId: { name: string; avatarUrl: string };
    message: string;
    isRead: boolean;
    createdAt: string;
}

export function NotificationsPanel({ isOpen, onClose, user }: NotificationsPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !user) return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch(`/api/notifications/${user.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchNotifications();

        const intervalId = setInterval(fetchNotifications, 10000);
        return () => clearInterval(intervalId);
    }, [isOpen, user]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'follow': return <UserPlus className="w-3.5 h-3.5 text-purple-500" />;
            case 'like': return <Heart className="w-3.5 h-3.5 text-pink-500" />;
            case 'message': return <MessageCircle className="w-3.5 h-3.5 text-blue-500" />;
            case 'group_message': return <Users className="w-3.5 h-3.5 text-indigo-500" />;
            default: return <Bell className="w-3.5 h-3.5 text-slate-400" />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden"
                    />

                    {/* Panel Container */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                        className="fixed top-0 left-0 h-full w-[360px] max-w-[88vw] border-r z-50 flex flex-col shadow-2xl"
                        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
                    >
                        {/* Header */}
                        <div className="p-5 sm:p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--card-border)" }}>
                            <h2 className="text-xl font-black flex items-center gap-2.5" style={{ color: "var(--text-dark)" }}>
                                <Bell className="w-5.5 h-5.5 text-blue-500" /> Notifications
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:opacity-80 transition-colors" style={{ color: "var(--text-light)" }}>
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Notifications List - High Contrast & Strict Left Grid Alignment */}
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-3 p-4 rounded-xl border skeleton-shimmer" style={{ borderColor: "var(--card-border)" }}>
                                            <div className="w-11 h-11 rounded-full bg-slate-400/20" />
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-4 rounded w-3/4 bg-slate-400/20" />
                                                <div className="h-3 rounded w-1/2 bg-slate-400/20" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-16 px-4 space-y-2">
                                    <Bell className="w-12 h-12 mx-auto text-slate-400 opacity-40" />
                                    <p className="text-base font-bold" style={{ color: "var(--text-dark)" }}>No notifications yet</p>
                                    <p className="text-xs font-medium" style={{ color: "var(--text-light)" }}>When friends like, comment, or message, alerts will appear here.</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        onClick={() => markAsRead(notif._id)}
                                        className={`flex items-start gap-3.5 p-4 border-b transition-all cursor-pointer ${
                                            notif.isRead ? '' : 'bg-blue-500/5'
                                        }`}
                                        style={{ borderColor: "var(--card-border)" }}
                                    >
                                        {/* Avatar with White Outline Badge */}
                                        <div className="relative flex-shrink-0">
                                            {notif.sourceUserId?.avatarUrl ? (
                                                <img src={notif.sourceUserId.avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full object-cover shadow-sm" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-blue-500" style={{ backgroundColor: "var(--accent-bg)" }}>
                                                    {notif.sourceUserId?.name ? notif.sourceUserId.name.substring(0, 2).toUpperCase() : 'U'}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 rounded-full p-0.5 border-2 border-white dark:border-[#1e1e1e] shadow-sm" style={{ backgroundColor: "var(--card-bg)" }}>
                                                {getIcon(notif.type)}
                                            </div>
                                        </div>

                                        {/* Left Grid Aligned Content */}
                                        <div className="flex flex-col items-start min-w-0 flex-1">
                                            <p className="text-sm leading-snug break-words" style={{ color: "var(--text-dark)" }}>
                                                <span className="font-extrabold mr-1" style={{ color: "var(--text-dark)" }}>
                                                    {notif.sourceUserId?.name || "Someone"}
                                                </span>
                                                <span className="font-normal">
                                                    {notif.type === 'follow' ? "started following you." :
                                                        notif.type === 'message' ? "sent you a message." :
                                                            notif.type === 'group_message' ? "sent a message to your group." :
                                                                " " + notif.message}
                                                </span>
                                            </p>
                                            <span className="text-xs font-semibold mt-1" style={{ color: "var(--text-light)" }}>
                                                {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Clean Unread Dot */}
                                        {!notif.isRead && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 self-center flex-shrink-0 shadow-sm" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
