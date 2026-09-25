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
import { Compass, Sparkles, BookOpen, Users, Video, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRooms } from "@/hooks/useRooms";

export default function DiscoverPage() {
    const [user, setUser] = useState<FirebaseUser | null>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [loadingAuth, setLoadingAuth] = useState(!(typeof window !== "undefined" && auth?.currentUser));
    const { rooms, loading: loadingRooms } = useRooms();
    const [allStudents, setAllStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);

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

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch(`/api/users?t=${Date.now()}`);
                if (res.ok) {
                    const data = await res.json();
                    setAllStudents(data.data || []);
                }
            } catch (err) {
                console.error("Error fetching students:", err);
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
    }, []);

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

    const categories = [
        { id: "ai", title: "Artificial Intelligence & ML", count: "1.2k Study Notes", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-400/10" },
        { id: "webdev", title: "Web Development & Next.js", count: "890 Code Snippets", icon: BookOpen, color: "text-indigo-400", bg: "bg-indigo-500/10" },
        { id: "circles", title: "Active Student Circles", count: "45 Study Groups", icon: Users, color: "text-pink-400", bg: "bg-pink-500/10" },
        { id: "rooms", title: "Live Video Rooms", count: `${rooms.length} Running Rooms`, icon: Video, color: "text-purple-400", bg: "bg-purple-500/10" },
    ];

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
                        <div className="dashboard-layout">
                            <div className="feed-column space-y-6">
                            {/* 1. Discover Hub Header */}
                            <div className="glass-card p-5 sm:p-6 border border-[var(--border)] rounded-2xl shadow-sm space-y-2" style={{ backgroundColor: "var(--surface)" }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        <Compass className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-dark)]">Discover Hub</h1>
                                        <p className="text-xs sm:text-sm font-medium text-[var(--muted)]">Explore student profiles, live study rooms, and popular communities on Egram.</p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Live Study Rooms */}
                            <div className="glass-card p-4 sm:p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-4" style={{ backgroundColor: "var(--surface)" }}>
                                <div className="flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-2">
                                        <Video className="w-5 h-5 text-indigo-400" />
                                        <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-dark)]">Live Study Rooms</h2>
                                    </div>
                                    <Link href="/study" className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">
                                        <span>Explore All</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>

                                <div className="space-y-2.5">
                                    {loadingRooms ? (
                                        <div className="space-y-2">
                                            {[1, 2].map(i => (
                                                <div key={i} className="h-16 rounded-xl skeleton-shimmer bg-[var(--surface-2)]" />
                                            ))}
                                        </div>
                                    ) : rooms.length === 0 ? (
                                        <div className="p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center space-y-1.5">
                                            <Video className="w-7 h-7 text-indigo-400 mx-auto opacity-70" />
                                            <p className="text-xs sm:text-sm font-bold text-[var(--text-dark)]">No study room is currently running</p>
                                            <p className="text-xs text-[var(--muted)]">Create a live video study room & invite your friends!</p>
                                        </div>
                                    ) : (
                                        rooms.map(room => (
                                            <div
                                                key={room.id}
                                                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
                                            >
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-extrabold truncate text-[var(--text-dark)]">{room.topic}</h3>
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex-shrink-0">
                                                            Live
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-medium text-[var(--muted)]">Host: {room.hostName} • {room.scheduleTime}</p>
                                                </div>

                                                <Link href="/study" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-sm flex-shrink-0">
                                                    Join Room
                                                </Link>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* 3. Egram Student Directory */}
                            <div className="glass-card p-4 sm:p-5 border border-[var(--border)] rounded-2xl shadow-sm space-y-4" style={{ backgroundColor: "var(--surface)" }}>
                                <div className="flex items-center justify-between px-0.5">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-400" />
                                        <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-dark)]">Student Directory</h2>
                                    </div>
                                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-purple-400">
                                        {allStudents.length} Registered
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {loadingStudents ? (
                                        <div className="space-y-2.5">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-16 rounded-2xl skeleton-shimmer bg-[var(--surface-2)]" />
                                            ))}
                                        </div>
                                    ) : allStudents.length === 0 ? (
                                        <div className="p-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center">
                                            <p className="text-xs sm:text-sm font-semibold text-[var(--muted)]">No student accounts found.</p>
                                        </div>
                                    ) : (
                                        allStudents.map(student => (
                                            <Link
                                                key={student.firebaseUid || student._id}
                                                href={`/profile/${student.firebaseUid}`}
                                                className="p-3 sm:p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-all block"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 flex-shrink-0">
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
                                                            <span className="text-sm font-extrabold truncate text-[var(--text-dark)]">{student.name}</span>
                                                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                                        </div>
                                                        <span className="text-xs text-[var(--muted)] truncate">
                                                            {student.bio || `@${student.name?.toLowerCase().replace(/\s+/g, '')}`}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {student.currentStreak > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20">
                                                            🔥 {student.currentStreak}d
                                                        </span>
                                                    )}
                                                    <span className="px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-bold text-indigo-400 flex items-center justify-center hover:border-indigo-500/30">
                                                        View Profile
                                                    </span>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* 4. Study Categories Grid */}
                            <div className="space-y-3">
                                <h2 className="text-xs font-bold uppercase tracking-wider px-1 text-[var(--muted)]">Popular Study Topics</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {categories.map((cat) => {
                                        const Icon = cat.icon;
                                        return (
                                            <Link
                                                key={cat.id}
                                                href={`/search?q=${encodeURIComponent(cat.title)}`}
                                                className="glass-card p-4 border border-[var(--border)] rounded-2xl flex flex-col justify-between gap-3 hover:border-indigo-500/40 transition-all group min-h-[100px]"
                                                style={{ backgroundColor: "var(--surface)" }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className={`p-2.5 rounded-xl ${cat.bg} flex-shrink-0`}>
                                                        <Icon className={`w-5 h-5 ${cat.color}`} />
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-[var(--muted)] group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                                </div>

                                                <div className="space-y-0.5">
                                                    <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-[var(--text-dark)]">{cat.title}</h3>
                                                    <p className="text-xs font-semibold text-[var(--muted)]">{cat.count}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                            <RightSidebar
                                user={user}
                                handleSignOut={() => auth.signOut().then(() => router.push("/login"))}
                                getInitials={getInitials}
                            />
                        </div>
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
