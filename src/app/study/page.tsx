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
import { Play, Pause, RotateCcw, Flame, Trophy, Clock, CheckCircle2, BookOpen, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";

interface LeaderboardUser {
    rank: number;
    name: string;
    college: string;
    hours: string;
    streak: number;
}

export default function StudyPage() {
    const [user, setUser] = useState<any>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [loading, setLoading] = useState(!(typeof window !== "undefined" && auth?.currentUser));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

    // Pomodoro Timer State
    const [mode, setMode] = useState<"focus" | "break">("focus");
    const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [weeklyMinutes, setWeeklyMinutes] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [topic, setTopic] = useState("General Study Focus");
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);

    const router = useRouter();
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    // Fetch real user streak & study stats from database
                    const res = await fetch(`/api/users/${currentUser.uid}`);
                    if (res.ok) {
                        const data = await res.json();
                        setCurrentStreak(data.currentStreak || 0);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    // Timer countdown effect
    useEffect(() => {
        let interval: any = null;
        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            setIsRunning(false);
            if (mode === "focus") {
                setCompletedSessions((prev) => prev + 1);
                setTodayMinutes((prev) => prev + 25);
                setWeeklyMinutes((prev) => prev + 25);
                addToast("🎉 Focus session completed! Take a 5-minute break.", "success");
                setMode("break");
                setTimeLeft(5 * 60);
            } else {
                addToast("🔔 Break time ended! Ready to focus?", "info");
                setMode("focus");
                setTimeLeft(25 * 60);
            }
        }
        return () => clearInterval(interval);
    }, [isRunning, timeLeft, mode, addToast]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(mode === "focus" ? 25 * 60 : 5 * 60);
    };

    const switchMode = (newMode: "focus" | "break") => {
        setMode(newMode);
        setIsRunning(false);
        setTimeLeft(newMode === "focus" ? 25 * 60 : 5 * 60);
    };

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.substring(0, 2).toUpperCase();
    };

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
                        <div className="feed-column">
                            
                            {/* Page Header */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black tracking-tight">Egram Study Mode</h1>
                                        <p className="text-xs text-[var(--text-light)] font-medium">
                                            Focus timer, study streaks & live collaboration
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Main Pomodoro Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass rounded-[32px] p-6 sm:p-8 text-center relative overflow-hidden border-2 border-[var(--card-border)] shadow-2xl"
                            >
                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <button
                                        onClick={() => switchMode("focus")}
                                        className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                                            mode === "focus"
                                                ? "bg-[var(--primary)] text-white shadow-lg shadow-purple-500/20"
                                                : "bg-[var(--accent-bg)] text-zinc-400"
                                        }`}
                                    >
                                        Focus (25m)
                                    </button>
                                    <button
                                        onClick={() => switchMode("break")}
                                        className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${
                                            mode === "break"
                                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                                                : "bg-[var(--accent-bg)] text-zinc-400"
                                        }`}
                                    >
                                        Break (5m)
                                    </button>
                                </div>

                                <div className="my-8">
                                    <span className="text-6xl sm:text-7xl font-black tracking-tighter font-mono text-[var(--text-dark)] drop-shadow-md">
                                        {formatTime(timeLeft)}
                                    </span>
                                    <p className="text-xs font-bold text-[var(--text-light)] uppercase tracking-widest mt-3">
                                        {mode === "focus" ? `Current Topic: ${topic}` : "Rest your eyes & hydrate 💧"}
                                    </p>
                                </div>

                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => setIsRunning(!isRunning)}
                                        className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm text-white shadow-xl transition-all transform active:scale-95 ${
                                            isRunning
                                                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                                                : "bg-[var(--primary)] hover:opacity-90 shadow-purple-600/30"
                                        }`}
                                    >
                                        {isRunning ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Start Focus</>}
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        className="p-3.5 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-zinc-400 hover:text-white transition-all active:scale-95"
                                        title="Reset Timer"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>

                            {/* Study Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="glass rounded-2xl p-4 text-center border border-[var(--card-border)]">
                                    <Flame className="w-6 h-6 mx-auto text-orange-500 mb-1" />
                                    <p className="text-xl font-black">{currentStreak} Days</p>
                                    <p className="text-[10px] text-[var(--text-light)] font-bold uppercase tracking-wider">Current Streak</p>
                                </div>

                                <div className="glass rounded-2xl p-4 text-center border border-[var(--card-border)]">
                                    <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                                    <p className="text-xl font-black">{completedSessions}</p>
                                    <p className="text-[10px] text-[var(--text-light)] font-bold uppercase tracking-wider">Sessions Today</p>
                                </div>

                                <div className="glass rounded-2xl p-4 text-center border border-[var(--card-border)]">
                                    <Clock className="w-6 h-6 mx-auto text-blue-500 mb-1" />
                                    <p className="text-xl font-black">{todayMinutes}m</p>
                                    <p className="text-[10px] text-[var(--text-light)] font-bold uppercase tracking-wider">Today's Focus</p>
                                </div>

                                <div className="glass rounded-2xl p-4 text-center border border-[var(--card-border)]">
                                    <Target className="w-6 h-6 mx-auto text-purple-500 mb-1" />
                                    <p className="text-xl font-black">{(weeklyMinutes / 60).toFixed(1)}h</p>
                                    <p className="text-[10px] text-[var(--text-light)] font-bold uppercase tracking-wider">Weekly Focus</p>
                                </div>
                            </div>

                            {/* Leaderboard Section */}
                            <div className="glass rounded-3xl p-6 border border-[var(--card-border)] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-amber-400" />
                                        <h3 className="font-black text-base">Study Leaderboard</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-3 py-1 rounded-full">
                                        Weekly Top
                                    </span>
                                </div>

                                {leaderboard.length === 0 ? (
                                    <div className="text-center py-10 rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--accent-bg)]">
                                        <Trophy className="w-8 h-8 mx-auto text-zinc-500 opacity-40 mb-1" />
                                        <p className="text-xs font-bold text-zinc-400">No study rankings yet.</p>
                                        <p className="text-[11px] text-[var(--text-light)]">Start a focus session to rank on the leaderboard!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {leaderboard.map((item) => (
                                            <div key={item.rank} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)]">
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                                                        item.rank === 1 ? "bg-amber-500 text-black" :
                                                        item.rank === 2 ? "bg-zinc-300 text-black" :
                                                        item.rank === 3 ? "bg-amber-700 text-white" : "bg-zinc-800 text-zinc-400"
                                                    }`}>
                                                        #{item.rank}
                                                    </span>
                                                    <div>
                                                        <p className="text-xs font-black">{item.name}</p>
                                                        <p className="text-[10px] text-[var(--text-light)] font-bold">{item.college}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-[var(--primary)]">{item.hours}</p>
                                                    <p className="text-[10px] text-orange-500 font-bold">🔥 {item.streak}d streak</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>

                        <RightSidebar user={user} handleSignOut={() => auth.signOut()} getInitials={getInitials} />
                    </main>
                    <MobileNav
                        onOpenCreatePost={() => setIsPostModalOpen(true)}
                        onOpenCreateMeet={() => setIsModalOpen(true)}
                        onOpenCreateStory={() => setIsStoryModalOpen(true)}
                        currentUserId={user.uid}
                    />

                    <CreateMeetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} getInitials={getInitials} />
                    <CreatePostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} user={user} />
                    <CreateStoryModal isOpen={isStoryModalOpen} onClose={() => setIsStoryModalOpen(false)} currentUser={user} onStoryCreated={() => window.dispatchEvent(new Event("userProfileUpdated"))} />
                </div>
            )}
        </>
    );
}
