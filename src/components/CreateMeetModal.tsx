import { useState } from "react";
import { X, Calendar, Video, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRooms } from "@/hooks/useRooms";
import { User } from "firebase/auth";
import { useToast } from "@/components/ToastProvider";

interface CreateMeetModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    getInitials: (name: string | null) => string;
}

export function CreateMeetModal({ isOpen, onClose, user, getInitials }: CreateMeetModalProps) {
    const { createRoom } = useRooms();
    const { addToast } = useToast();
    const [topic, setTopic] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const [meetPlatform, setMeetPlatform] = useState<"jitsi" | "google">("jitsi");
    const [customGoogleLink, setCustomGoogleLink] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!topic.trim()) {
            addToast("Please enter a study topic", "error");
            return;
        }

        setIsSubmitting(true);
        const finalTime = scheduleTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let linkToUse = undefined;
        if (meetPlatform === "google") {
            linkToUse = customGoogleLink.trim() || "https://meet.google.com/new";
        }

        const success = await createRoom({
            topic: topic.trim(),
            scheduleTime: finalTime,
            hostId: user.uid,
            hostName: user.displayName || user.email || "Student",
            hostInitials: getInitials(user.displayName || user.email),
        }, linkToUse);

        setIsSubmitting(false);

        if (success) {
            addToast("🎉 Study room created!", "success");
            setTopic("");
            setScheduleTime("");
            setCustomGoogleLink("");
            onClose();
        } else {
            addToast("Failed to create room. Please try again.", "error");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="glass-card w-full max-w-md p-5 sm:p-6 border border-[var(--border)] rounded-[20px] shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto"
                        style={{ backgroundColor: "var(--surface)" }}
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        transition={{ type: "spring", damping: 25, stiffness: 320 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                                    <Video className="w-5.5 h-5.5" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-base sm:text-lg font-black text-[var(--text-dark)] tracking-tight truncate">Create Study Room</h2>
                                    <p className="text-xs text-[var(--muted)] font-medium truncate">Host live video sessions with your student circle</p>
                                </div>
                            </div>
                            <button 
                                className="p-2 rounded-full bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--text-dark)] transition-all cursor-pointer flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center" 
                                onClick={onClose}
                                aria-label="Close modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Platform Switcher */}
                            <div className="flex bg-[var(--surface-2)] p-1 rounded-2xl border border-[var(--border)] gap-1">
                                <button
                                    type="button"
                                    onClick={() => setMeetPlatform("jitsi")}
                                    className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
                                        meetPlatform === "jitsi" 
                                            ? "bg-indigo-600 text-white shadow-sm" 
                                            : "text-[var(--muted)] hover:text-[var(--text-dark)]"
                                    }`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Instant Video
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setMeetPlatform("google")}
                                    className={`flex-1 py-2 px-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px] ${
                                        meetPlatform === "google" 
                                            ? "bg-indigo-600 text-white shadow-sm" 
                                            : "text-[var(--muted)] hover:text-[var(--text-dark)]"
                                    }`}
                                >
                                    <Video className="w-3.5 h-3.5" /> Google Meet
                                </button>
                            </div>

                            {/* Focus Topic */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[var(--text-dark)] uppercase tracking-wider">Study Focus Topic</label>
                                <input
                                    type="text"
                                    placeholder="E.g., Machine Learning, Data Structures..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-xs sm:text-sm text-[var(--text-dark)] font-medium focus:outline-none transition-all placeholder:text-[var(--muted)] min-h-[44px]"
                                    required
                                />
                            </div>

                            {/* Schedule Time */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[var(--text-dark)] uppercase tracking-wider">Schedule Time (Optional)</label>
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-xs sm:text-sm text-[var(--text-dark)] font-medium focus:outline-none transition-all cursor-pointer min-h-[44px]"
                                />
                            </div>

                            {/* Custom Google Meet URL */}
                            {meetPlatform === "google" && (
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-dark)] uppercase tracking-wider">Google Meet URL (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://meet.google.com/abc-defg-hij"
                                        value={customGoogleLink}
                                        onChange={(e) => setCustomGoogleLink(e.target.value)}
                                        className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-xs sm:text-sm text-[var(--text-dark)] font-medium focus:outline-none transition-all placeholder:text-[var(--muted)] min-h-[44px]"
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !topic.trim()}
                                className="w-full py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer min-h-[48px]"
                            >
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Calendar className="w-4 h-4" />
                                        <span>Create & Launch Study Room</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
