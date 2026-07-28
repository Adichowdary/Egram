import { useState } from "react";
import { X, Calendar, Video, Sparkles, ExternalLink } from "lucide-react";
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
            addToast("Please enter a focus topic", "error");
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
            addToast("🎉 Study room created instantly!", "success");
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
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl overflow-hidden relative"
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between mb-5 border-b border-zinc-800 pb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Video className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Create Study Room</h2>
                                    <p className="text-xs text-zinc-400">Host live video sessions with your circle</p>
                                </div>
                            </div>
                            <button className="p-1.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            
                            {/* Platform Selector Switcher */}
                            <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setMeetPlatform("jitsi")}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${meetPlatform === "jitsi" ? "bg-purple-600 text-white shadow-md" : "text-zinc-400 hover:text-white"}`}
                                >
                                    <Sparkles className="w-3.5 h-3.5" /> Instant Video
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMeetPlatform("google")}
                                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${meetPlatform === "google" ? "bg-blue-600 text-white shadow-md" : "text-zinc-400 hover:text-white"}`}
                                >
                                    <Video className="w-3.5 h-3.5" /> Google Meet
                                </button>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-300 ml-1">Focus Topic</label>
                                <input
                                    type="text"
                                    placeholder="E.g., Algorithms & Data Structures"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-zinc-300 ml-1">Schedule Time (Optional)</label>
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>

                            {meetPlatform === "google" && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-zinc-300 ml-1">Google Meet URL (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://meet.google.com/abc-defg-hij"
                                        value={customGoogleLink}
                                        onChange={(e) => setCustomGoogleLink(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600"
                                    />
                                    <span className="text-[10px] text-zinc-500 ml-1">Leaves blank to auto-create Google Meet link</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !topic.trim()}
                                className="w-full mt-2 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Calendar className="w-4 h-4" />
                                        <span>Create & Share Study Room</span>
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
