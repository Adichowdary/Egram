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
                        className="bg-zinc-900 border-2 border-zinc-800 rounded-[32px] p-5 sm:p-8 w-full max-w-xl shadow-2xl overflow-y-auto relative max-h-[92vh]"
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.92, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.92, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3.5 rounded-2xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                    <Video className="w-7 h-7" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Create Study Room</h2>
                                    <p className="text-xs sm:text-sm text-zinc-400 font-medium">Host live video sessions with your circle</p>
                                </div>
                            </div>
                            <button className="p-2.5 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={onClose}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            
                            {/* Platform Selector Switcher */}
                            <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setMeetPlatform("jitsi")}
                                    className={`flex-1 py-3.5 px-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${meetPlatform === "jitsi" ? "bg-purple-600 text-white shadow-xl scale-[1.02]" : "text-zinc-400 hover:text-white"}`}
                                >
                                    <Sparkles className="w-4 h-4" /> Instant Video
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMeetPlatform("google")}
                                    className={`flex-1 py-3.5 px-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${meetPlatform === "google" ? "bg-blue-600 text-white shadow-xl scale-[1.02]" : "text-zinc-400 hover:text-white"}`}
                                >
                                    <Video className="w-4 h-4" /> Google Meet
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm sm:text-base font-black text-white ml-1">Focus Topic</label>
                                <input
                                    type="text"
                                    placeholder="E.g., Algorithms & Data Structures"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full bg-zinc-950 border-2 border-zinc-700/90 focus:border-blue-500 rounded-2xl px-5 py-4 sm:py-4.5 text-base sm:text-lg text-white font-bold focus:outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm sm:text-base font-black text-white ml-1">Schedule Time (Optional)</label>
                                <input
                                    type="time"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full bg-zinc-950 border-2 border-zinc-700/90 focus:border-blue-500 rounded-2xl px-5 py-4 sm:py-4.5 text-base sm:text-lg text-white font-bold focus:outline-none transition-all shadow-inner cursor-pointer"
                                />
                            </div>

                            {meetPlatform === "google" && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm sm:text-base font-black text-white ml-1">Google Meet URL (Optional)</label>
                                    <input
                                        type="url"
                                        placeholder="https://meet.google.com/abc-defg-hij"
                                        value={customGoogleLink}
                                        onChange={(e) => setCustomGoogleLink(e.target.value)}
                                        className="w-full bg-zinc-950 border-2 border-zinc-700/90 focus:border-blue-500 rounded-2xl px-5 py-4 sm:py-4.5 text-base sm:text-lg text-white font-bold focus:outline-none transition-all placeholder:text-zinc-600 shadow-inner"
                                    />
                                    <span className="text-xs text-zinc-400 ml-1 font-medium">Leave blank to auto-create Google Meet link</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || !topic.trim()}
                                className="w-full mt-3 py-4.5 rounded-2xl font-black text-base sm:text-lg text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-blue-600/40 cursor-pointer active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Calendar className="w-5.5 h-5.5" />
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
