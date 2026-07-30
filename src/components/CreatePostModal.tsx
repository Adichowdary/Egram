import { useState, useRef } from "react";
import { X, Image as ImageIcon, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "firebase/auth";
import { useToast } from "@/components/ToastProvider";

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export function CreatePostModal({ isOpen, onClose, user }: CreatePostModalProps) {
    const { addToast } = useToast();
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 25 * 1024 * 1024) {
                addToast("⚠️ Image size is too large (Max size 25MB).", "error");
                e.target.value = "";
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() && !imageFile) return;

        setIsSubmitting(true);
        try {
            let mediaUrl = "";
            if (imageFile) {
                try {
                    const formData = new FormData();
                    formData.append("file", imageFile);
                    formData.append("bucket", "posts");
                    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        mediaUrl = uploadData.url;
                    } else {
                        mediaUrl = imagePreview || "";
                    }
                } catch {
                    mediaUrl = imagePreview || "";
                }
            }

            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    authorId: user.uid,
                    content: content.trim(),
                    images: mediaUrl ? [mediaUrl] : [],
                }),
            });

            if (res.ok) {
                addToast("🎉 Post shared successfully!", "success");
                setContent("");
                setImageFile(null);
                setImagePreview(null);
                onClose();
                window.dispatchEvent(new Event("postCreated"));
            } else {
                throw new Error("Failed to create post");
            }
        } catch (error) {
            console.error("Post creation error:", error);
            addToast("Failed to share post. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="w-full max-w-lg p-6 sm:p-7 border rounded-2xl shadow-2xl space-y-5 relative"
                        style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}
                        onClick={e => e.stopPropagation()}
                        initial={{ scale: 0.94, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.94, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between pb-3.5 border-b" style={{ borderColor: "var(--card-border)" }}>
                            <div className="flex items-center gap-2.5">
                                <Sparkles className="w-5.5 h-5.5 text-blue-500" />
                                <h2 className="text-lg sm:text-xl font-black tracking-tight" style={{ color: "var(--text-dark)" }}>Create Post</h2>
                            </div>
                            <button 
                                className="p-2.5 rounded-full transition-all cursor-pointer border min-w-[44px] min-h-[44px] flex items-center justify-center"
                                style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)", color: "var(--text-light)" }}
                                onClick={onClose}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full border rounded-xl p-4 text-sm sm:text-base font-medium focus:outline-none focus:border-blue-500 resize-none h-36 leading-relaxed"
                                style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)", color: "var(--text-dark)" }}
                                placeholder="What are you studying or building today? Share your progress, code, or thoughts..."
                            />

                            {imagePreview && (
                                <div className="relative rounded-xl overflow-hidden border aspect-video bg-black/60" style={{ borderColor: "var(--card-border)" }}>
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                    <button 
                                        onClick={() => { setImageFile(null); setImagePreview(null); }}
                                        className="absolute top-2 right-2 p-2 bg-black/80 rounded-full text-white hover:bg-black transition-all cursor-pointer"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* Action Buttons Box */}
                            <div className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2.5 px-5 py-3 rounded-xl border hover:border-blue-500/40 transition-all text-sm sm:text-base font-extrabold cursor-pointer min-h-[48px]"
                                    style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)", color: "var(--text-dark)" }}
                                >
                                    <ImageIcon className="w-5 h-5 text-emerald-500" />
                                    <span>Attach Media</span>
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleImageChange}
                                />

                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (!content.trim() && !imageFile)}
                                    className="flex items-center gap-2.5 bg-blue-500 text-white px-5 py-3 rounded-xl font-extrabold text-sm sm:text-base hover:bg-blue-600 disabled:opacity-40 shadow-md transition-all cursor-pointer min-h-[48px]"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                    <span>{isSubmitting ? "Publishing..." : "Publish Post"}</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
