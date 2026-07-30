import { useState, useEffect } from "react";
import { MoreHorizontal, Heart, MessageCircle, Send, Bookmark, Share, Trash2, CheckCircle2, BookmarkCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "./ToastProvider";
import { usePosts, Post } from "@/hooks/usePosts";

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorInitials: string;
    avatarUrl?: string;
    text: string;
    timestamp: any;
    parentId?: string;
}

interface PostCardProps {
    post: Post;
    user: any;
    getInitials: (name: string | null) => string;
    onDelete?: (postId: string) => void;
}

export function PostCard({ post: initialPost, user, getInitials, onDelete }: PostCardProps) {
    const [post, setPost] = useState(initialPost);
    const [isLiked, setIsLiked] = useState(initialPost.likes.includes(user.uid));
    const [isSaved, setIsSaved] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({});
    const [newComment, setNewComment] = useState("");
    const [showBigHeart, setShowBigHeart] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    
    const { addToast } = useToast();
    const { toggleLike, addComment, fetchComments, deleteComment, deletePost, isSubmitting } = usePosts(user);

    useEffect(() => {
        setPost(initialPost);
        setIsLiked(initialPost.likes.includes(user.uid));
        if ((initialPost as any).initialComments && Array.isArray((initialPost as any).initialComments)) {
            setComments((initialPost as any).initialComments.map((c: any, idx: number) => ({
                id: c._id || `c-${Date.now()}-${idx}`,
                authorId: c.user,
                authorName: resolveAuthorName(c.userName, c.user),
                authorInitials: getInitials(resolveAuthorName(c.userName, c.user)),
                avatarUrl: c.avatarUrl || "",
                text: c.text,
                timestamp: { toDate: () => new Date(c.createdAt || Date.now()) },
                parentId: c.parentId
            })));
        }
    }, [initialPost, user.uid]);

    useEffect(() => {
        if (showComments && post.id) {
            setIsLoadingComments(true);
            fetchComments(post.id).then((serverComments) => {
                if (Array.isArray(serverComments)) {
                    setComments(serverComments.map((c: any, idx: number) => ({
                        id: c._id || `c-${Date.now()}-${idx}`,
                        authorId: c.user,
                        authorName: resolveAuthorName(c.userName, c.user),
                        authorInitials: getInitials(resolveAuthorName(c.userName, c.user)),
                        avatarUrl: c.avatarUrl || "",
                        text: c.text,
                        timestamp: { toDate: () => new Date(c.createdAt || Date.now()) },
                        parentId: c.parentId
                    })));
                }
            }).finally(() => setIsLoadingComments(false));
        }
    }, [showComments, post.id]);

    const handleLike = async () => {
        const wasLiked = isLiked;
        const newLikes = wasLiked 
            ? post.likes.filter(id => id !== user.uid)
            : [...post.likes, user.uid];
        
        setIsLiked(!wasLiked);
        setPost(prev => ({ ...prev, likes: newLikes }));

        try {
            await toggleLike(post, wasLiked);
        } catch (error) {
            setIsLiked(wasLiked);
            setPost(prev => ({ ...prev, likes: wasLiked ? [...prev.likes, user.uid] : prev.likes.filter(id => id !== user.uid) }));
        }
    };

    const handleDoubleTap = () => {
        if (!isLiked) handleLike();
        setShowBigHeart(true);
        setTimeout(() => setShowBigHeart(false), 800);
    };

    const handleToggleBookmark = () => {
        setIsSaved(!isSaved);
        addToast(isSaved ? "Removed from saved posts" : "🎉 Saved to your reading list!", isSaved ? "info" : "success");
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
            addToast("🎉 Post link copied to clipboard!", "success");
        } catch (err) {
            addToast("Failed to copy link", "error");
        }
    };

    const resolveAuthorName = (rawName: string | undefined | null, commentUserId: string) => {
        if (rawName && rawName !== "Student" && rawName !== "User") return rawName;
        if (commentUserId === user?.uid) return user?.displayName || user?.email?.split('@')[0] || "You";
        return "User";
    };

    const handleToggleCommentLike = (commentId: string) => {
        setCommentLikes(prev => ({ ...prev, [commentId]: !prev[commentId] }));
    };

    const handleDeleteComment = async (commentId: string) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        setPost(prev => ({ ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) }));

        try {
            const updatedComments = await deleteComment(post.id, commentId);
            if (Array.isArray(updatedComments)) {
                setComments(updatedComments.map((c: any, idx: number) => ({
                    id: c._id || `c-${Date.now()}-${idx}`,
                    authorId: c.user,
                    authorName: resolveAuthorName(c.userName, c.user),
                    authorInitials: getInitials(resolveAuthorName(c.userName, c.user)),
                    avatarUrl: c.avatarUrl || "",
                    text: c.text,
                    timestamp: { toDate: () => new Date(c.createdAt || Date.now()) },
                    parentId: c.parentId
                })));
            }
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = newComment.trim();
        if (!text || isSubmitting) return;

        const currentAuthorName = user.displayName || user.email?.split('@')[0] || "You";
        const optimisticComment: Comment = {
            id: `temp-${Date.now()}`,
            authorId: user.uid,
            authorName: currentAuthorName,
            authorInitials: getInitials(currentAuthorName),
            avatarUrl: user.photoURL || "",
            text,
            timestamp: { toDate: () => new Date() }
        };

        setComments(prev => [optimisticComment, ...prev]);
        setNewComment("");
        setPost(prev => ({ ...prev, commentsCount: (prev.commentsCount || 0) + 1 }));

        try {
            const serverComments = await addComment(post.id, text);
            if (Array.isArray(serverComments)) {
                setComments(serverComments.map((c: any, idx: number) => {
                    const resolvedName = resolveAuthorName(c.userName, c.user);
                    return {
                        id: c._id || `c-${Date.now()}-${idx}`,
                        authorId: c.user,
                        authorName: resolvedName,
                        authorInitials: getInitials(resolvedName),
                        avatarUrl: c.avatarUrl || "",
                        text: c.text,
                        timestamp: { toDate: () => new Date(c.createdAt || Date.now()) },
                        parentId: c.parentId
                    };
                }));
            }
        } catch (error) {
            console.error("Comment post error:", error);
        }
    };

    const handleDelete = async () => {
        try {
            await deletePost(post.id);
            if (onDelete) {
                onDelete(post.id);
            }
        } catch (error) {
            // Error handled in hook
        }
    };

    const getTimeAgo = (timestamp: any) => {
        if (!timestamp) return "Just now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    };

    return (
        <article 
            className="rounded-2xl border transition-all duration-200 shadow-md overflow-hidden flex flex-col h-auto"
            style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--card-border)",
            }}
        >
            {/* 1. Header Widget */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b" style={{ borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-sm flex-shrink-0">
                        <div className="w-full h-full rounded-full p-0.5 overflow-hidden flex items-center justify-center font-black text-sm text-blue-500" style={{ backgroundColor: "var(--background)" }}>
                            {post.authorInitials}
                        </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base sm:text-lg font-extrabold tracking-tight truncate" style={{ color: "var(--text-dark)" }}>{post.authorName}</span>
                            <CheckCircle2 className="w-4.5 h-4.5 text-blue-500 fill-blue-500/20 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold" style={{ color: "var(--text-light)" }}>
                            {/* Plain text Student badge (non-clickable) */}
                            <span className="px-2.5 py-0.5 rounded-full font-semibold text-xs select-none" style={{ backgroundColor: "var(--primary-bg)", color: "var(--primary)" }}>Student</span>
                            <span>•</span>
                            <span>{post.timestamp?.toDate() ? getTimeAgo(post.timestamp) : "Just now"}</span>
                        </div>
                    </div>
                </div>

                {/* More options three-dots button with mr-1.5 padding */}
                <div className="relative flex-shrink-0 mr-1.5">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2.5 rounded-full transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                        style={{ color: "var(--text-light)" }}
                        aria-label="More options"
                    >
                        <MoreHorizontal className="w-6 h-6" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className="absolute right-0 mt-2 w-52 border rounded-xl shadow-2xl z-50 overflow-hidden p-2 space-y-1"
                                style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}
                            >
                                <button
                                    onClick={handleShare}
                                    className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center gap-2.5"
                                    style={{ color: "var(--text-dark)" }}
                                >
                                    <Share className="w-4.5 h-4.5 text-blue-500" /> Share / Copy Link
                                </button>

                                {post.authorId === user.uid && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left px-4 py-2.5 text-xs sm:text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all flex items-center gap-2.5"
                                    >
                                        <Trash2 className="w-4.5 h-4.5" /> Delete Post
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 2. Media Presentation */}
            {post.mediaUrl && (
                <div className="relative overflow-hidden flex items-center justify-center cursor-pointer select-none group bg-black/40" onDoubleClick={handleDoubleTap}>
                    {isImageLoading && (
                        <div className="absolute inset-0 skeleton-shimmer" />
                    )}
                    <img 
                        src={post.mediaUrl} 
                        alt="Post content" 
                        className={`w-full max-h-[600px] object-cover transition-all duration-300 group-hover:scale-[1.01] ${isImageLoading ? 'opacity-0' : 'opacity-100'}`} 
                        loading="lazy" 
                        onLoad={() => setIsImageLoading(false)}
                    />
                    
                    <AnimatePresence>
                        {showBigHeart && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                                className="absolute pointer-events-none z-10"
                            >
                                <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* 3. Action Bar Widget */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-t" style={{ borderColor: "var(--card-border)" }}>
                <div className="flex items-center gap-6">
                    <motion.button
                        whileTap={{ scale: 0.75 }}
                        onClick={handleLike}
                        className={`flex items-center gap-2 transition-colors cursor-pointer text-sm sm:text-base font-bold min-w-[44px] min-h-[44px] ${isLiked ? 'text-rose-500' : ''}`}
                        style={{ color: isLiked ? undefined : "var(--text-dark)" }}
                        aria-label={isLiked ? "Unlike post" : "Like post"}
                    >
                        <Heart fill={isLiked ? "currentColor" : "none"} className="w-6 h-6" />
                        <span>{post.likes.length}</span>
                    </motion.button>

                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowComments(!showComments)} 
                        className="flex items-center gap-2 text-sm sm:text-base font-bold transition-colors cursor-pointer min-w-[44px] min-h-[44px]"
                        style={{ color: "var(--text-dark)" }}
                        aria-label="Toggle comments"
                    >
                        <MessageCircle className="w-6 h-6" />
                        <span>{post.commentsCount || 0}</span>
                    </motion.button>

                    <button 
                        onClick={handleShare}
                        className="transition-colors cursor-pointer p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        style={{ color: "var(--text-dark)" }}
                        aria-label="Share post"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>

                <button 
                    onClick={handleToggleBookmark}
                    className={`transition-colors cursor-pointer p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center ${isSaved ? 'text-blue-500' : ''}`}
                    style={{ color: isSaved ? undefined : "var(--text-light)" }}
                    aria-label="Bookmark post"
                >
                    {isSaved ? <BookmarkCheck className="w-6 h-6 fill-blue-500" /> : <Bookmark className="w-6 h-6" />}
                </button>
            </div>

            {/* 4. Text Content Caption Widget */}
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2.5">
                <p className="text-sm sm:text-base font-medium leading-relaxed break-words" style={{ color: "var(--text-dark)" }}>
                    {post.content}
                </p>

                {post.commentsCount && post.commentsCount > 0 && !showComments && (
                    <button
                        onClick={() => setShowComments(true)}
                        className="text-xs sm:text-sm font-bold transition-colors pt-1 block cursor-pointer"
                        style={{ color: "var(--text-light)" }}
                    >
                        View all {post.commentsCount} comments
                    </button>
                )}
            </div>

            {/* 5. Integrated Comments Drawer Widget - Nested Replies & Hover Controls */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="border-t"
                        style={{ backgroundColor: "var(--accent-bg)", borderColor: "var(--card-border)" }}
                    >
                        <div className="max-h-72 overflow-y-auto p-4 sm:p-5 space-y-3.5 no-scrollbar">
                            {isLoadingComments ? (
                                <div className="py-4 text-center text-xs sm:text-sm flex items-center justify-center gap-2 font-bold" style={{ color: "var(--text-light)" }}>
                                    <div className="w-4.5 h-4.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span>Loading comments...</span>
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-xs sm:text-sm font-medium text-center py-2" style={{ color: "var(--text-light)" }}>No comments yet. Start the conversation!</p>
                            ) : (
                                comments.map((comment, index) => {
                                    const canDelete = comment.authorId === user.uid || post.authorId === user.uid;
                                    const isCommentLiked = !!commentLikes[comment.id];
                                    const isReply = !!comment.parentId || index > 0; // Visual reply nesting formatting

                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={comment.id} 
                                            className={`group flex items-start gap-3 text-sm transition-all ${
                                                isReply ? "pl-6 sm:pl-8 border-l-2 my-1" : ""
                                            }`}
                                            style={{ borderColor: isReply ? "var(--card-border)" : undefined }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-sm overflow-hidden">
                                                {comment.avatarUrl ? (
                                                    <img src={comment.avatarUrl} alt={comment.authorName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{comment.authorInitials || getInitials(comment.authorName)}</span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="leading-relaxed break-words flex flex-wrap items-baseline gap-x-2">
                                                    <span className="font-extrabold text-sm" style={{ color: "var(--text-dark)" }}>{comment.authorName}</span>
                                                    <span className="font-normal text-sm break-words" style={{ color: "var(--text-dark)" }}>{comment.text}</span>
                                                </div>
                                                <div className="flex items-center gap-3.5 mt-1 text-xs font-semibold" style={{ color: "var(--text-light)" }}>
                                                    <span>{getTimeAgo(comment.timestamp)}</span>
                                                    <button 
                                                        onClick={() => handleToggleCommentLike(comment.id)}
                                                        className={`hover:opacity-80 transition-colors cursor-pointer ${isCommentLiked ? 'text-rose-500 font-bold' : ''}`}
                                                    >
                                                        {isCommentLiked ? 'Liked' : 'Like'}
                                                    </button>
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                                                            title="Delete Comment"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleToggleCommentLike(comment.id)}
                                                className={`p-1.5 transition-colors cursor-pointer ${isCommentLiked ? 'text-rose-500' : ''}`}
                                                style={{ color: isCommentLiked ? undefined : "var(--text-light)" }}
                                                aria-label="Like comment"
                                            >
                                                <Heart className={`w-4 h-4 ${isCommentLiked ? 'fill-current' : ''}`} />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Interactive Comment Input Form with Button Pill */}
                        <form onSubmit={handleAddComment} className="flex items-center gap-2 px-4 py-3 border-t min-h-[56px]" style={{ backgroundColor: "var(--card-bg)", borderColor: "var(--card-border)" }}>
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium outline-none"
                                style={{ color: "var(--text-dark)" }}
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || isSubmitting}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm disabled:opacity-40 px-4 py-1.5 rounded-full shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>Post</span>
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </article>
    );
}
