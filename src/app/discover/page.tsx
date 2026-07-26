"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { CreateMeetModal } from "@/components/CreateMeetModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { SplashScreen } from "@/components/SplashScreen";
import { useToast } from "@/components/ToastProvider";
import { UserCard } from "@/components/UserCard";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Sparkles, TrendingUp, Users, BookOpen, Search, Flame } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DiscoverPage() {
    const [user, setUser] = useState<any>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [loading, setLoading] = useState(!(typeof window !== "undefined" && auth?.currentUser));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [trendingLearners, setTrendingLearners] = useState<any[]>([]);

    const router = useRouter();
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchTrending();
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    const fetchTrending = async () => {
        try {
            const res = await fetch(`/api/users/search?q=a`);
            if (res.ok) {
                const users = await res.json();
                setTrendingLearners(users.slice(0, 5).map((u: any) => ({
                    uid: u.firebaseUid,
                    displayName: u.name,
                    photoURL: u.avatarUrl,
                    bio: u.bio,
                    followersCount: u.followersCount || 0,
                    followingCount: u.followingCount || 0,
                    streak: u.currentStreak || 0
                })));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

    const trendingTopics = ["#Algorithms", "#GATE2026", "#WebDev", "#CyberSecurity", "#MachineLearning", "#Python"];

    return (
        <>
            <AnimatePresence>{loading && <SplashScreen key="splash" />}</AnimatePresence>

            {!loading && user && (
                <div className="min-h-screen bg-[var(--background)] text-[var(--text-dark)] pb-24 md:pb-8">
                    <Sidebar
                        user={user}
                        setIsModalOpen={setIsModalOpen}
                        setIsPostModalOpen={setIsPostModalOpen}
                        getInitials={getInitials}
                    />

                    <main className="main-content flex-col items-center px-4 py-8">
                        <div className="w-full max-w-[620px] mx-auto space-y-8">

                            {/* Header */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                        <Compass className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">Egram Discover</h1>
                                        <p className="text-xs text-[var(--text-light)] font-medium">
                                            Trending topics, top learners & study hubs
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Trending Topics Pill Bar */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--text-light)]">
                                    <TrendingUp className="w-4 h-4 text-orange-500" /> Trending Topics
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {trendingTopics.map((topic) => (
                                        <button
                                            key={topic}
                                            onClick={() => router.push(`/search?q=${encodeURIComponent(topic.replace('#', ''))}`)}
                                            className="px-4 py-2 rounded-xl text-xs font-black bg-[var(--accent-bg)] border border-[var(--card-border)] hover:border-purple-500/50 hover:text-[var(--primary)] transition-all whitespace-nowrap"
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Recommended Learners Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-purple-400" />
                                        <h3 className="font-black text-base">Recommended Students</h3>
                                    </div>
                                    <button 
                                        onClick={() => router.push('/search')}
                                        className="text-xs font-bold text-[var(--primary)] hover:underline"
                                    >
                                        View All
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {trendingLearners.length === 0 ? (
                                        <div className="text-center py-10 rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--accent-bg)] text-xs text-zinc-400 font-bold">
                                            <Users className="w-8 h-8 mx-auto text-zinc-500 opacity-40 mb-1" />
                                            <span>No students to discover yet. Invite your friends!</span>
                                        </div>
                                    ) : (
                                        trendingLearners.map((profile) => (
                                            <UserCard key={profile.uid} profile={profile} />
                                        ))
                                    )}
                                </div>
                            </div>

                        </div>
                    </main>

                    <RightSidebar user={user} handleSignOut={() => auth.signOut()} getInitials={getInitials} />
                    <MobileNav onOpenCreatePost={() => setIsPostModalOpen(true)} currentUserId={user.uid} />

                    <CreateMeetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} getInitials={getInitials} />
                    <CreatePostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} user={user} />
                </div>
            )}
        </>
    );
}
