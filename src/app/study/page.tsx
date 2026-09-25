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
import { Play, Pause, RotateCcw, Flame, Clock, BookOpen, Sparkles, Target, Award } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudyPage() {
    const [user, setUser] = useState<any>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [loading, setLoading] = useState(!(typeof window !== "undefined" && auth?.currentUser));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

    // Pomodoro Timer State
    const [mode, setMode] = useState<"focus" | "break">("focus");
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [completedSessions, setCompletedSessions] = useState(0);
    const [todayMinutes, setTodayMinutes] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [topic, setTopic] = useState("Algorithms & System Design");

    const router = useRouter();
    const { addToast } = useToast();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
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
                        <div className="feed-column space-y-6">
                            
                            {/* Page Title */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight">Study & Focus Hub</h1>
                                        <p className="text-xs text-[var(--text-light)] font-medium">
                                            Track focus sessions, maintain streaks, and host live study rooms
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Main Pomodoro Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-card p-6 sm:p-8 text-center relative overflow-hidden border border-[var(--card-border)] rounded-3xl shadow-xl space-y-6"
                            >
                                {/* Focus vs Break Pills */}
                                <div className="flex items-center justify-center gap-2 p-1 bg-[var(--accent-bg)] rounded-2xl max-w-xs mx-auto border border-[var(--card-border)]">
                                    <button
                                        onClick={() => switchMode("focus")}
                                        className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                            mode === "focus"
                                                ? "bg-indigo-500 text-white shadow-md"
                                                : "text-[var(--text-light)] hover:text-[var(--text-dark)]"
                                        }`}
                                    >
                                        Focus (25m)
                                    </button>
                                    <button
                                        onClick={() => switchMode("break")}
                                        className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                            mode === "break"
                                                ? "bg-emerald-500 text-white shadow-md"
                                                : "text-[var(--text-light)] hover:text-[var(--text-dark)]"
                                        }`}
                                    >
                                        Break (5m)
                                    </button>
                                </div>

                                {/* Timer Display */}
                                <div className="py-4">
                                    <span className="text-6xl sm:text-7xl font-black tracking-tighter font-mono text-[var(--text-dark)] drop-shadow-sm">
                                        {formatTime(timeLeft)}
                                    </span>
                                    <div className="mt-3 max-w-sm mx-auto">
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder=""
                                            className="w-full bg-[var(--accent-bg)] border border-[var(--card-border)] text-center text-xs font-bold text-[var(--text-dark)] py-2 px-4 rounded-xl outline-none focus:border-indigo-500 transition-all placeholder:text-[var(--text-light)]"
                                        />
                                    </div>
                                </div>

                                {/* Timer Controls */}
                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => setIsRunning(!isRunning)}
                                        className={`flex items-center gap-2 px-7 py-3 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg transition-all active:scale-95 cursor-pointer ${
                                            isRunning
                                                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                                                : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"
                                        }`}
                                    >
                                        {isRunning ? <><Pause className="w-4 h-4" /> Pause Session</> : <><Play className="w-4 h-4" /> Start Focus Session</>}
                                    </button>

                                    <button
                                        onClick={handleReset}
                                        className="p-3 rounded-2xl bg-[var(--accent-bg)] border border-[var(--card-border)] text-[var(--text-light)] hover:text-[var(--text-dark)] transition-all active:scale-95 cursor-pointer"
                                        title="Reset Timer"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>

                            {/* Study Stats Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="glass-card p-4 text-center border border-[var(--card-border)] rounded-2xl">
                                    <Clock className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                                    <span className="text-lg font-black text-[var(--text-dark)]">{todayMinutes}m</span>
                                    <span className="text-[10px] font-bold text-[var(--text-light)] block uppercase tracking-wider">Today</span>
                                </div>

                                <div className="glass-card p-4 text-center border border-[var(--card-border)] rounded-2xl">
                                    <Target className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                                    <span className="text-lg font-black text-[var(--text-dark)]">{completedSessions}</span>
                                    <span className="text-[10px] font-bold text-[var(--text-light)] block uppercase tracking-wider">Sessions</span>
                                </div>

                                <div className="glass-card p-4 text-center border border-[var(--card-border)] rounded-2xl">
                                    <Flame className="w-5 h-5 text-amber-500 fill-amber-500 mx-auto mb-1 animate-pulse" />
                                    <span className="text-lg font-black text-amber-500">{currentStreak}d</span>
                                    <span className="text-[10px] font-bold text-[var(--text-light)] block uppercase tracking-wider">Streak</span>
                                </div>
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
