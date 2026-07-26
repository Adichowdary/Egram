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
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Check, Search } from "lucide-react";
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
                    // Query real groups/circles from DB
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

                    <main className="main-content flex-col items-center px-4 py-8">
                        <div className="w-full max-w-[620px] mx-auto space-y-6">

                            {/* Header */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-500/20">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">Egram Circles</h1>
                                        <p className="text-xs text-[var(--text-light)] font-medium">
                                            Student communities, subject groups & campus hubs
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Search & Category Filter */}
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search student circles by topic or interest..."
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] text-sm font-medium focus:outline-none focus:border-[var(--primary)]"
                                    />
                                </div>

                                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                                                activeCategory === cat
                                                    ? "bg-[var(--primary)] text-white shadow-lg shadow-purple-500/20"
                                                    : "bg-[var(--accent-bg)] text-zinc-400 border border-[var(--card-border)] hover:text-white"
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
                                    <div className="text-center py-16 rounded-3xl border border-dashed border-[var(--card-border)] bg-[var(--accent-bg)]">
                                        <Users className="w-10 h-10 mx-auto text-zinc-500 opacity-40 mb-2" />
                                        <p className="text-sm font-bold">No circles found</p>
                                        <p className="text-xs text-[var(--text-light)]">No student communities created yet.</p>
                                    </div>
                                ) : (
                                    filteredCircles.map((circle) => (
                                        <motion.div
                                            key={circle.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="glass rounded-3xl p-5 border border-[var(--card-border)] flex items-center justify-between gap-4 shadow-xl hover:border-purple-500/30 transition-all"
                                        >
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                                                    {circle.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black text-base truncate">{circle.name}</h3>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                            {circle.category}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[var(--text-light)] font-medium line-clamp-2 mt-1">
                                                        {circle.description}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-zinc-400 mt-2">
                                                        👥 {circle.membersCount.toLocaleString()} Members
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => toggleJoinCircle(circle.id)}
                                                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 flex-shrink-0 ${
                                                    circle.isJoined
                                                        ? "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700"
                                                        : "bg-[var(--primary)] text-white hover:opacity-90 shadow-lg shadow-purple-500/30"
                                                }`}
                                            >
                                                {circle.isJoined ? <><Check className="w-4 h-4" /> Joined</> : <><Plus className="w-4 h-4" /> Join</>}
                                            </button>
                                        </motion.div>
                                    ))
                                )}
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
