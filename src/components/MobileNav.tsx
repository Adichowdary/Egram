"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, MessageSquare, User, BookOpen, Users } from "lucide-react";

interface MobileNavProps {
    onOpenCreatePost?: () => void;
    currentUserId?: string;
}

export function MobileNav({ onOpenCreatePost, currentUserId }: MobileNavProps) {
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/discover", label: "Discover", icon: Compass },
        { href: "/study", label: "Study", icon: BookOpen },
        { href: "/circles", label: "Circles", icon: Users },
        { href: "/messages", label: "Messages", icon: MessageSquare },
        { href: currentUserId ? `/profile/${currentUserId}` : "/profile", label: "Profile", icon: User },
    ];

    return (
        <nav 
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-[var(--card-border)] px-2 py-2 flex items-center justify-around shadow-2xl"
            style={{ background: "rgba(18, 18, 24, 0.92)" }}
        >
            {navItems.slice(0, 2).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                            isActive ? "text-[var(--primary)] scale-110" : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <Icon className="w-6 h-6" />
                        <span className="text-[10px] font-bold mt-1 tracking-tight">{item.label}</span>
                    </Link>
                );
            })}

            {/* Center (+) Create Post Action */}
            <button
                onClick={onOpenCreatePost}
                aria-label="Create Post"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-orange-400 text-white shadow-lg shadow-purple-500/30 transform active:scale-95 transition-transform"
            >
                <PlusSquare className="w-6 h-6" />
            </button>

            {navItems.slice(2).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.label === "Profile" && pathname.startsWith("/profile"));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${
                            isActive ? "text-[var(--primary)] scale-110" : "text-zinc-400 hover:text-white"
                        }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-[9px] font-bold mt-1 tracking-tight">{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
