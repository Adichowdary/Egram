"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { MobileNav } from "@/components/MobileNav";
import { CreateMeetModal } from "@/components/CreateMeetModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { CreateStoryModal } from "@/components/CreateStoryModal";
import { SplashScreen } from "@/components/SplashScreen";
import { AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, Video, ArrowRight, Sparkles, BookOpen, Compass } from "lucide-react";
import Link from "next/link";
import { useRooms } from "@/hooks/useRooms";

export default function SearchPage() {
    const [user, setUser] = useState<FirebaseUser | null>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [loadingAuth, setLoadingAuth] = useState(!(typeof window !== "undefined" && auth?.currentUser));
    const [query, setQuery] = useState("");
    const [userResults, setUserResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<"all" | "students" | "topics" | "rooms">("all");
    const { rooms } = useRooms();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setLoadingAuth(false);
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const studyTopicsList = [
        { id: "ml", title: "Machine Learning & AI", postsCount: "1.4k posts", icon: Sparkles },
        { id: "webdev", title: "Full-Stack Web Development", postsCount: "980 posts", icon: BookOpen },
        { id: "ds", title: "Data Structures & Algorithms", postsCount: "1.2k posts", icon: Compass },
        { id: "cyber", title: "Cyber Security & Networks", postsCount: "640 posts", icon: ShieldCheck },
        { id: "calc", title: "Calculus & Linear Algebra", postsCount: "520 posts", icon: BookOpen },
    ];

    useEffect(() => {
        if (!query.trim()) {
            setUserResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    setUserResults(list);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(handler);
    }, [query]);

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

    const matchingTopics = studyTopicsList.filter(t => 
        !query.trim() || t.title.toLowerCase().includes(query.toLowerCase())
    );

    const matchingRooms = rooms.filter(r => 
        !query.trim() || r.topic.toLowerCase().includes(query.toLowerCase()) || r.hostName.toLowerCase().includes(query.toLowerCase())
    );

    const hasAnyResults = userResults.length > 0 || (query.trim() && matchingTopics.length > 0) || (query.trim() && matchingRooms.length > 0);

    return (
        <>
            <AnimatePresence>{loadingAuth && <SplashScreen key="splash" />}</AnimatePresence>

            {!loadingAuth && user && (
                <div className="min-h-screen bg-[var(--background)] text-[var(--text-dark)] pb-24 md:pb-8">
                    <Sidebar
                        user={user}
                        setIsModalOpen={setIsModalOpen}
                        setIsPostModalOpen={setIsPostModalOpen}
                        getInitials={getInitials}
                    />

                    <main className="main-content">
                        <div className="feed-column space-y-5">
                            {/* 1. Header & Search Input (Placeholder Removed) */}
                            <div className="glass-card p-5 sm:p-6 border border-[var(--border)] rounded-2xl shadow-sm space-y-4" style={{ backgroundColor: "var(--surface)" }}>
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-dark)]">Search Egram</h1>
                                        <p className="text-xs text-[var(--muted)] font-medium">Find students, study topics, and live study rooms</p>
                                    </div>
                                </div>
                                
                                <div className="relative flex items-center">
                                    <Search className="w-5 h-5 absolute left-4 text-[var(--muted)] pointer-events-none z-10" />
                                    <input
                                        type="text"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder=""
                                        className="w-full border border-[var(--border)] rounded-2xl pl-12 pr-4 py-3.5 text-sm sm:text-base font-medium outline-none transition-all min-h-[48px] focus:border-indigo-500/50"
                                        style={{ backgroundColor: "var(--surface-2)", color: "var(--text-dark)" }}
                                    />
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                                    {[
                                        { id: "all", label: "All Results" },
                                        { id: "students", label: "Students" },
                                        { id: "topics", label: "Study Topics" },
                                        { id: "rooms", label: "Study Rooms" }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveFilter(tab.id as any)}
                                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold border transition-all cursor-pointer flex-shrink-0 min-w-max ${
                                                activeFilter === tab.id
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text-dark)]"
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Results Section */}
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="p-8 text-center text-sm font-bold flex items-center justify-center gap-2 text-[var(--muted)]">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span>Searching Egram...</span>
                                    </div>
                                ) : query.trim() && !hasAnyResults ? (
                                    /* Clean Empty State */
                                    <div className="glass-card p-8 sm:p-10 border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center space-y-3" style={{ backgroundColor: "var(--surface)" }}>
                                        <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            <Search className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-base sm:text-lg font-black text-[var(--text-dark)]">No results found for "{query}"</h3>
                                        <p className="text-xs sm:text-sm text-[var(--muted)] max-w-sm">
                                            Try searching for a student, topic, or study room keyword.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Students Section */}
                                        {(activeFilter === "all" || activeFilter === "students") && (userResults.length > 0 || !query.trim()) && (
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between px-1">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Students</h3>
                                                    <span className="text-xs font-semibold text-[var(--muted)]">{userResults.length} found</span>
                                                </div>

                                                {userResults.length === 0 ? (
                                                    <div className="p-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--muted)] font-medium text-center">
                                                        Type a student name or keyword to search.
                                                    </div>
                                                ) : (
                                                    userResults.map(student => (
                                                        <Link
                                                            key={student.firebaseUid || student._id}
                                                            href={`/profile/${student.firebaseUid}`}
                                                            className="glass-card p-3.5 sm:p-4 border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-all min-h-[64px]"
                                                            style={{ backgroundColor: "var(--surface)" }}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 flex-shrink-0">
                                                                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center font-bold text-xs bg-[var(--background)] text-indigo-400">
                                                                        {student.avatarUrl ? (
                                                                            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span>{student.name?.substring(0, 2).toUpperCase() || 'ST'}</span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col min-w-0">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <span className="text-sm sm:text-base font-extrabold truncate text-[var(--text-dark)]">{student.name}</span>
                                                                        <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                                                    </div>
                                                                    <span className="text-xs text-[var(--muted)] truncate">
                                                                        {student.bio || `@${student.name?.toLowerCase().replace(/\s+/g, '')}`}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <span className="px-4 py-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-xs font-bold text-indigo-400 flex-shrink-0 min-h-[38px] flex items-center justify-center hover:border-indigo-500/30">
                                                                View Profile
                                                            </span>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        )}

                                        {/* Study Topics Section */}
                                        {(activeFilter === "all" || activeFilter === "topics") && matchingTopics.length > 0 && (
                                            <div className="space-y-2.5 pt-2">
                                                <div className="flex items-center justify-between px-1">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Study Topics</h3>
                                                    <span className="text-xs font-semibold text-[var(--muted)]">{matchingTopics.length} topics</span>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {matchingTopics.map(topic => {
                                                        const Icon = topic.icon;
                                                        return (
                                                            <Link
                                                                key={topic.id}
                                                                href={`/search?q=${encodeURIComponent(topic.title)}`}
                                                                className="glass-card p-4 border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-all min-h-[60px]"
                                                                style={{ backgroundColor: "var(--surface)" }}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                                                                        <Icon className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-sm font-extrabold truncate text-[var(--text-dark)]">{topic.title}</span>
                                                                        <span className="text-xs font-medium text-[var(--muted)]">{topic.postsCount}</span>
                                                                    </div>
                                                                </div>
                                                                <ArrowRight className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Live Study Rooms Section */}
                                        {(activeFilter === "all" || activeFilter === "rooms") && (
                                            <div className="space-y-2.5 pt-2">
                                                <div className="flex items-center justify-between px-1">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Live Study Rooms</h3>
                                                    <span className="text-xs font-semibold text-[var(--muted)]">{matchingRooms.length} active</span>
                                                </div>

                                                {matchingRooms.length === 0 ? (
                                                    <div className="p-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-xs text-[var(--muted)] font-medium text-center">
                                                        No active rooms match this search right now.
                                                    </div>
                                                ) : (
                                                    matchingRooms.map(room => (
                                                        <div
                                                            key={room.id}
                                                            className="glass-card p-4 border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-all min-h-[64px]"
                                                            style={{ backgroundColor: "var(--surface)" }}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 flex-shrink-0">
                                                                    <Video className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm sm:text-base font-extrabold truncate text-[var(--text-dark)]">{room.topic}</span>
                                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex-shrink-0">
                                                                            Live
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-xs text-[var(--muted)] truncate">Host: {room.hostName} • {room.scheduleTime}</span>
                                                                </div>
                                                            </div>

                                                            <Link href="/study" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-sm flex-shrink-0">
                                                                Join Room
                                                            </Link>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </>
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
