"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { CreateMeetModal } from "@/components/CreateMeetModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { CreateStoryModal } from "@/components/CreateStoryModal";
import { SplashScreen } from "@/components/SplashScreen";
import { useToast } from "@/components/ToastProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Check, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface Circle {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    membersCount: number;
    isJoined?: boolean;
}

export default function CirclesPage() {
    const [user, setUser] = useState<any>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [loading, setLoading] = useState(!(typeof window !== "undefined" && auth?.currentUser));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [circles, setCircles] = useState<Circle[]>([]);

    const router = useRouter();
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const res = await fetch(`/api/groups`);
                    if (res.ok) {
                        const data = await res.json();
                        const realGroups = (data.groups || []).map((g: any) => ({
                            id: g._id || g.id,
                            name: g.name,
                            description: g.description || "Student community & discussion group",
                            category: g.category || "General",
                            icon: "🎓",
                            membersCount: g.members?.length || 1,
                            isJoined: g.members?.includes(currentUser.uid) || false
                        }));
                        setCircles(realGroups);
                    }
                } catch (e) {
                    console.error("Error fetching real groups:", e);
                } finally {
                    setLoading(false);
                }
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    const toggleJoinCircle = async (circleId: string) => {
        if (!user) return;
        setCircles((prev) =>
            prev.map((c) => {
                if (c.id === circleId) {
                    const nextJoined = !c.isJoined;
                    addToast(nextJoined ? `Joined ${c.name}!` : `Left ${c.name}`, nextJoined ? "success" : "info");
                    return {
                        ...c,
                        isJoined: nextJoined,
                        membersCount: c.membersCount + (nextJoined ? 1 : -1),
                    };
                }
                return c;
            })
        );
    };

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

    const categories = ["All", "Computer Science", "Security", "Exams", "AI & ML", "Campus"];

    const filteredCircles = circles.filter((c) => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "All" || c.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

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

                    <main className="main-content">
                        <div className="feed-column space-y-6">
                            
                            {/* Page Header */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight">Student Circles</h1>
                                        <p className="text-xs text-[var(--text-light)] font-medium">
                                            Join subject communities, study groups, and project hubs
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Search & Category Pills */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Search className="w-4 h-4 text-[var(--text-light)] absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder=""
                                        className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-[var(--text-dark)] placeholder:text-[var(--text-light)] focus:outline-none focus:border-indigo-500 transition-all shadow-xs"
                                    />
                                </div>

                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                                activeCategory === cat
                                                    ? "bg-indigo-500 text-white shadow-md"
                                                    : "bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-light)] hover:text-[var(--text-dark)]"
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Circles Grid */}
                            <div className="space-y-4">
                                {filteredCircles.length === 0 ? (
                                    <div className="glass-card p-8 text-center border border-dashed border-[var(--card-border)] rounded-3xl space-y-2">
                                        <Sparkles className="w-8 h-8 text-indigo-500 mx-auto opacity-60" />
                                        <p className="text-sm font-black text-[var(--text-dark)]">No circles found</p>
                                        <p className="text-xs text-[var(--text-light)]">Try searching with a different term or category!</p>
                                    </div>
                                ) : (
                                    filteredCircles.map((circle) => (
                                        <motion.div
                                            key={circle.id}
                                            whileHover={{ y: -2 }}
                                            className="glass-card p-5 border border-[var(--card-border)] rounded-3xl transition-all shadow-sm hover:shadow-md flex items-center justify-between gap-4"
                                        >
                                            <div className="flex items-start gap-3.5 min-w-0">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-black text-xl flex-shrink-0">
                                                    {circle.icon}
                                                </div>

                                                <div className="flex flex-col min-w-0">
                                                    <h3 className="text-sm font-extrabold text-[var(--text-dark)] truncate">{circle.name}</h3>
                                                    <p className="text-xs text-[var(--text-light)] line-clamp-1 mt-0.5">{circle.description}</p>
                                                    
                                                    <div className="flex items-center gap-2 mt-2 text-[11px] text-[var(--text-light)] font-bold">
                                                        <span className="px-2 py-0.5 rounded-full bg-[var(--accent-bg)] border border-[var(--card-border)]">{circle.category}</span>
                                                        <span>•</span>
                                                        <span>{circle.membersCount} members</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => toggleJoinCircle(circle.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                                                    circle.isJoined
                                                        ? "bg-[var(--accent-bg)] border border-[var(--card-border)] text-[var(--text-dark)]"
                                                        : "bg-indigo-500 text-white shadow-md hover:bg-indigo-600"
                                                }`}
                                            >
                                                {circle.isJoined ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                        <span>Joined</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>Join</span>
                                                    </>
                                                )}
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                        </div>

                        <RightSidebar
                            user={user}
                            handleSignOut={() => auth.signOut().then(() => router.push("/login"))}
                            getInitials={getInitials}
                        />
                    </main>

                    <MobileNav
                        onOpenCreatePost={() => setIsPostModalOpen(true)}
                        onOpenCreateMeet={() => setIsModalOpen(true)}
                        onOpenCreateStory={() => setIsStoryModalOpen(true)}
                        currentUserId={user.uid}
                    />

                    <CreateMeetModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        user={user}
                        getInitials={getInitials}
                    />

                    <CreatePostModal
                        isOpen={isPostModalOpen}
                        onClose={() => setIsPostModalOpen(false)}
                        user={user}
                    />

                    <CreateStoryModal
                        isOpen={isStoryModalOpen}
                        onClose={() => setIsStoryModalOpen(false)}
                        currentUser={user}
                        onStoryCreated={() => window.dispatchEvent(new Event("userProfileUpdated"))}
                    />
                </div>
            )}
        </>
    );
}
