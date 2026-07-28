"use client";

import { useState, useEffect } from "react";
import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { AnimatePresence, motion } from "framer-motion";
import { SplashScreen } from "@/components/SplashScreen";
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    User,
    AlertCircle,
    ArrowRight,
    Sparkles,
    BookOpen,
    Flame,
    Users,
    CheckCircle2,
    ShieldCheck,
    Zap
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const router = useRouter();

    const saveUserToFirestore = async (user: any, customName?: string) => {
        if (!user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const resolvedName = customName || user.displayName || email.split('@')[0];

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: resolvedName,
                    photoURL: user.photoURL || "",
                    createdAt: serverTimestamp(),
                    streak: 1,
                    lastLogin: serverTimestamp()
                });
            } else {
                await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
            }

            await fetch("/api/users/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: resolvedName,
                    photoURL: user.photoURL,
                }),
            });
        } catch (err) {
            console.error("Error saving user data: ", err);
        }
    };

    const getTargetRedirect = () => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            return params.get("redirect") || "/";
        }
        return "/";
    };

    useEffect(() => {
        if (typeof window !== "undefined" && auth) {
            getRedirectResult(auth).then(async (result) => {
                if (result?.user) {
                    await saveUserToFirestore(result.user);
                    router.push(getTargetRedirect());
                }
            }).catch(err => console.error("Redirect auth error:", err));
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setInitialLoading(false);
                router.push(getTargetRedirect());
            } else {
                setInitialLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError("");
            const provider = new GoogleAuthProvider();
            try {
                const result = await signInWithPopup(auth, provider);
                await saveUserToFirestore(result.user);
                router.push(getTargetRedirect());
            } catch (popupErr: any) {
                if (popupErr.code === "auth/popup-blocked" || popupErr.code === "auth/popup-closed-by-user") {
                    await signInWithRedirect(auth, provider);
                } else {
                    throw popupErr;
                }
            }
        } catch (err: any) {
            console.error("Google Sign-In error:", err);
            if (err.code === "auth/unauthorized-domain") {
                setError("Domain not authorized in Firebase Console.");
            } else {
                setError(err.message || "Failed to sign in with Google.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            if (isSignUp) {
                if (!name.trim()) throw new Error("Full Name is required to sign up.");
                const result = await createUserWithEmailAndPassword(auth, email, password);
                if (name.trim()) {
                    await updateProfile(result.user, { displayName: name.trim() }).catch(err => console.error(err));
                }
                await saveUserToFirestore(result.user, name);
            } else {
                const result = await signInWithEmailAndPassword(auth, email, password);
                await saveUserToFirestore(result.user);
            }
            router.push(getTargetRedirect());
        } catch (err: any) {
            let msg = err.message || "Authentication failed.";
            if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
                msg = "Invalid email or password. Please check your credentials.";
            } else if (err.code === "auth/user-not-found") {
                msg = "No account found with this email.";
            } else if (err.code === "auth/email-already-in-use") {
                msg = "An account with this email already exists.";
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Calculate password strength indicator score
    const getPasswordStrength = () => {
        if (!password) return { score: 0, label: "", color: "bg-zinc-800" };
        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password) || /[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 1) return { score: 25, label: "Weak", color: "bg-red-500" };
        if (score === 2 || score === 3) return { score: 65, label: "Good", color: "bg-amber-500" };
        return { score: 100, label: "Strong", color: "bg-emerald-500" };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <>
            <AnimatePresence>
                {initialLoading && <SplashScreen key="splash" />}
            </AnimatePresence>

            {!initialLoading && (
                <main className="relative min-h-screen w-full flex items-center justify-center bg-black text-white overflow-hidden p-4 sm:p-6 lg:p-12">
                    
                    {/* Glowing Dynamic Radial Meshes */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-blue-600/20 blur-[150px] rounded-full animate-pulse" />
                        <div className="absolute -bottom-32 -right-32 w-[650px] h-[650px] bg-purple-600/20 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-pink-500/10 blur-[140px] rounded-full" />
                    </div>

                    {/* Main Split Layout Container */}
                    <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        
                        {/* Left Hero Column (Desktop Viewport Feature Showcase) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="hidden lg:flex lg:col-span-6 flex-col justify-center space-y-8 pr-4"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold w-fit shadow-lg shadow-blue-500/10">
                                <Sparkles className="w-4 h-4 text-blue-400" />
                                <span>The Ultimate Student Social Network</span>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                                    Study together, <br />
                                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                                        build daily streaks.
                                    </span>
                                </h1>
                                <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                                    Join thousands of ambitious learners. Track focus pomodoro sessions, launch live Google Meet rooms, and share 24-hour study stories.
                                </p>
                            </div>

                            {/* Feature Cards Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
                                    <Flame className="w-6 h-6 text-orange-500 mb-2" />
                                    <h3 className="text-sm font-bold text-white mb-0.5">Study Streaks</h3>
                                    <p className="text-xs text-zinc-400">Keep daily momentum active with peer accountability.</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md">
                                    <BookOpen className="w-6 h-6 text-purple-400 mb-2" />
                                    <h3 className="text-sm font-bold text-white mb-0.5">Pomodoro Mode</h3>
                                    <p className="text-xs text-zinc-400">Timed focus sessions designed for peak productivity.</p>
                                </div>
                            </div>

                            {/* Social Proof Avatars */}
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex -space-x-3">
                                    <div className="w-9 h-9 rounded-full bg-blue-600 border-2 border-black flex items-center justify-center text-xs font-black">AD</div>
                                    <div className="w-9 h-9 rounded-full bg-purple-600 border-2 border-black flex items-center justify-center text-xs font-black">SK</div>
                                    <div className="w-9 h-9 rounded-full bg-pink-600 border-2 border-black flex items-center justify-center text-xs font-black">MJ</div>
                                </div>
                                <div className="text-xs">
                                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                                        <span>★★★★★</span>
                                    </div>
                                    <span className="text-zinc-400">Trusted by students worldwide</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Form Column (Sleek High-Precision Card) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="lg:col-span-6 w-full max-w-lg sm:max-w-xl mx-auto"
                        >
                            <div className="bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800/90 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-black/90 relative overflow-hidden">
                                
                                {/* Top Glow Accent Line */}
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />

                                {/* Brand Header */}
                                <div className="flex flex-col items-center text-center mb-7">
                                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-blue-500/30 mb-3.5 flex items-center justify-center">
                                        <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                                            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
                                        </div>
                                    </div>
                                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                                        {isSignUp ? "Create Account" : "Welcome Back"}
                                    </h2>
                                    <p className="text-xs sm:text-base text-zinc-400 mt-1.5 font-medium">
                                        {isSignUp ? "Join Egram to start learning & connecting" : "Sign in to access your study dashboard"}
                                    </p>
                                </div>

                                {/* Animated Mode Segment Switcher */}
                                <div className="relative flex bg-zinc-950/90 p-1.5 rounded-2xl border border-zinc-800/90 mb-7 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => { setIsSignUp(false); setError(""); }}
                                        className={`relative flex-1 py-3 text-xs sm:text-base font-extrabold rounded-xl transition-all duration-200 ${
                                            !isSignUp ? "text-white shadow-lg" : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        {!isSignUp && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-600/40"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10">Sign In</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setIsSignUp(true); setError(""); }}
                                        className={`relative flex-1 py-3 text-xs sm:text-base font-extrabold rounded-xl transition-all duration-200 ${
                                            isSignUp ? "text-white shadow-lg" : "text-zinc-400 hover:text-white"
                                        }`}
                                    >
                                        {isSignUp && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-600/40"
                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10">Sign Up</span>
                                    </button>
                                </div>

                                {/* Error Alert Banner */}
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs sm:text-sm font-bold"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                                        <span className="leading-snug">{error}</span>
                                    </motion.div>
                                )}

                                {/* Google Sign-In Button */}
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-zinc-950 hover:bg-zinc-800/90 text-zinc-100 border border-zinc-800 px-5 py-4 rounded-2xl font-extrabold text-xs sm:text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 shadow-sm group"
                                >
                                    <svg className="w-5.5 h-5.5 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span>Continue with Google</span>
                                </button>

                                {/* Divider Line */}
                                <div className="relative flex items-center justify-center my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-zinc-800/80" />
                                    </div>
                                    <div className="relative bg-zinc-900 px-4 text-xs font-black text-zinc-500 uppercase tracking-widest">
                                        or continue with email
                                    </div>
                                </div>

                                {/* Main Form */}
                                <form onSubmit={handleEmailAuth} className="space-y-5">
                                    
                                    {/* Full Name Input (Sign Up only) */}
                                    <AnimatePresence mode="popLayout">
                                        {isSignUp && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-2 ml-1">
                                                    Full Name
                                                </label>
                                                <div className="relative flex items-center">
                                                    <User className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none z-20" />
                                                    <input
                                                        type="text"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        className="w-full bg-zinc-950/90 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                                                        placeholder=""
                                                        required={isSignUp}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Email Input */}
                                    <div>
                                        <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-300 mb-2 ml-1">
                                            Email Address
                                        </label>
                                        <div className="relative flex items-center">
                                            <Mail className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none z-20" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-zinc-950/90 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-2xl text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                                                placeholder=""
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Password Input */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2 ml-1">
                                            <label className="block text-xs sm:text-sm font-extrabold uppercase tracking-wider text-zinc-300">
                                                Password
                                            </label>
                                            {isSignUp && password && (
                                                <span className="text-xs font-bold text-zinc-400">
                                                    Strength: <strong className={passwordStrength.label === 'Strong' ? 'text-emerald-400' : passwordStrength.label === 'Good' ? 'text-amber-400' : 'text-red-400'}>{passwordStrength.label}</strong>
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative flex items-center">
                                            <Lock className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none z-20" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full bg-zinc-950/90 border border-zinc-800 text-white pl-12 pr-12 py-4 rounded-2xl text-sm sm:text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                                                placeholder=""
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 text-zinc-400 hover:text-white p-1 z-20 select-none"
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        {/* Password Strength Indicator Bar */}
                                        {isSignUp && password && (
                                            <div className="w-full h-1.5 bg-zinc-950 rounded-full mt-2.5 overflow-hidden border border-zinc-800">
                                                <div
                                                    className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                                    style={{ width: `${passwordStrength.score}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-4 sm:py-4.5 rounded-2xl font-black text-sm sm:text-base transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>{isSignUp ? "Create Free Account" : "Sign In to Egram"}</span>
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* Footer Toggle Text */}
                                <div className="text-center mt-6 pt-4 border-t border-zinc-800/70 flex flex-col items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                                        className="text-xs sm:text-sm text-zinc-400 hover:text-white font-semibold transition-colors"
                                    >
                                        {isSignUp ? (
                                            <span>Already have an account? <strong className="text-blue-400 hover:underline">Sign In</strong></span>
                                        ) : (
                                            <span>Don't have an account? <strong className="text-blue-400 hover:underline">Sign Up</strong></span>
                                        )}
                                    </button>
                                </div>

                            </div>
                        </motion.div>

                    </div>
                </main>
            )}
        </>
    );
}
