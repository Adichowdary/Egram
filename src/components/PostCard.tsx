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
                timestamp: { toDate: () => new Date(c.createdAt || Date.now()) }
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
                        timestamp: { toDate: () => new Date(c.createdAt || Date.now()) }
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
                    timestamp: { toDate: () => new Date(c.createdAt || Date.now()) }
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
                        timestamp: { toDate: () => new Date(c.createdAt || Date.now()) }
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
        <article className="bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden shadow-lg space-y-0 transition-all">
            {/* 1. Header Widget - Author Name in header only */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-sm flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-[#121212] p-0.5 overflow-hidden flex items-center justify-center font-black text-sm text-blue-400">
                            {post.authorInitials}
                        </div>
                    </div>

                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate">{post.authorName}</span>
                            <CheckCircle2 className="w-4 h-4 text-blue-500 fill-blue-500/20 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-[#a0a0a0]">
                            <span>Student Community</span>
                            <span>•</span>
                            <span>{post.timestamp?.toDate() ? getTimeAgo(post.timestamp) : "Just now"}</span>
                        </div>
                    </div>
                </div>

                <div className="relative flex-shrink-0">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-full hover:bg-white/5 text-[#a0a0a0] hover:text-white transition-all cursor-pointer"
                        aria-label="More options"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className="absolute right-0 mt-2 w-48 bg-[#242424] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl z-50 overflow-hidden p-1.5 space-y-1"
                            >
                                <button
                                    onClick={handleShare}
                                    className="w-full text-left px-3.5 py-2 text-xs font-bold text-white hover:bg-white/5 rounded-lg transition-all flex items-center gap-2"
                                >
                                    <Share className="w-4 h-4 text-blue-500" /> Share / Copy Link
                                </button>

                                {post.authorId === user.uid && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Post
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* 2. Media Presentation */}
            {post.mediaUrl && (
                <div className="relative overflow-hidden bg-[#121212] flex items-center justify-center cursor-pointer select-none group" onDoubleClick={handleDoubleTap}>
                    {isImageLoading && (
                        <div className="absolute inset-0 skeleton-shimmer" />
                    )}
                    <img 
                        src={post.mediaUrl} 
                        alt="Post content" 
                        className={`w-full max-h-[580px] object-cover transition-all duration-300 group-hover:scale-[1.01] ${isImageLoading ? 'opacity-0' : 'opacity-100'}`} 
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
                                <Heart className="w-20 h-20 text-rose-500 fill-rose-500 drop-shadow-2xl" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* 3. Action Bar Widget */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-t border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-5">
                    <motion.button
                        whileTap={{ scale: 0.75 }}
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer text-xs sm:text-sm font-bold ${isLiked ? 'text-rose-500' : 'text-[#a0a0a0] hover:text-white'}`}
                        aria-label={isLiked ? "Unlike post" : "Like post"}
                    >
                        <Heart fill={isLiked ? "currentColor" : "none"} className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>{post.likes.length}</span>
                    </motion.button>

                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowComments(!showComments)} 
                        className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#a0a0a0] hover:text-blue-400 transition-colors cursor-pointer"
                        aria-label="Toggle comments"
                    >
                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>{post.commentsCount || 0}</span>
                    </motion.button>

                    <button 
                        onClick={handleShare}
                        className="text-[#a0a0a0] hover:text-blue-400 transition-colors cursor-pointer"
                        aria-label="Share post"
                    >
                        <Send className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                    </button>
                </div>

                <button 
                    onClick={handleToggleBookmark}
                    className={`transition-colors cursor-pointer ${isSaved ? 'text-blue-500' : 'text-[#a0a0a0] hover:text-white'}`}
                    aria-label="Bookmark post"
                >
                    {isSaved ? <BookmarkCheck className="w-5 h-5 sm:w-6 sm:h-6 fill-blue-500" /> : <Bookmark className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
            </div>

            {/* 4. Text Content & Caption Widget - No duplicated author name */}
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-2">
                <p className="text-xs sm:text-sm font-medium text-white leading-relaxed break-words">
                    {post.content}
                </p>

                {post.commentsCount && post.commentsCount > 0 && !showComments && (
                    <button
                        onClick={() => setShowComments(true)}
                        className="text-xs font-bold text-[#a0a0a0] hover:text-blue-400 transition-colors pt-1 block cursor-pointer"
                    >
                        View all {post.commentsCount} comments
                    </button>
                )}
            </div>

            {/* 5. Integrated Comments Drawer Widget */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="border-t border-[rgba(255,255,255,0.08)] bg-[#242424]"
                    >
                        <div className="max-h-64 overflow-y-auto p-4 sm:p-5 space-y-3 no-scrollbar">
                            {isLoadingComments ? (
                                <div className="py-4 text-center text-xs text-[#a0a0a0] flex items-center justify-center gap-2 font-bold">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span>Loading comments...</span>
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-xs text-[#a0a0a0] font-medium text-center py-2">No comments yet. Start the conversation!</p>
                            ) : (
                                comments.map(comment => {
                                    const canDelete = comment.authorId === user.uid || post.authorId === user.uid;
                                    const isCommentLiked = !!commentLikes[comment.id];
                                    return (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={comment.id} 
                                            className="flex items-start gap-2.5 text-xs sm:text-sm"
                                        >
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-sm overflow-hidden">
                                                {comment.avatarUrl ? (
                                                    <img src={comment.avatarUrl} alt={comment.authorName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{comment.authorInitials || getInitials(comment.authorName)}</span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="leading-snug break-words flex flex-wrap items-baseline gap-x-1.5">
                                                    <span className="font-bold text-white">{comment.authorName}</span>
                                                    <span className="text-[#a0a0a0] font-normal break-words">{comment.text}</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#a0a0a0] font-medium">
                                                    <span>{getTimeAgo(comment.timestamp)}</span>
                                                    <button 
                                                        onClick={() => handleToggleCommentLike(comment.id)}
                                                        className={`hover:text-white transition-colors cursor-pointer ${isCommentLiked ? 'text-rose-500 font-bold' : ''}`}
                                                    >
                                                        {isCommentLiked ? 'Liked' : 'Like'}
                                                    </button>
                                                    {canDelete && (
                                                        <button 
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3 h-3" /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleToggleCommentLike(comment.id)}
                                                className={`p-1 hover:text-rose-500 transition-colors cursor-pointer ${isCommentLiked ? 'text-rose-500' : 'text-[#a0a0a0]'}`}
                                                aria-label="Like comment"
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${isCommentLiked ? 'fill-current' : ''}`} />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>

                        {/* Interactive Comment Input Form */}
                        <form onSubmit={handleAddComment} className="flex items-center gap-2 px-4 py-3 border-t border-[rgba(255,255,255,0.08)] bg-[#1e1e1e]">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1 bg-transparent border-none text-xs sm:text-sm font-medium text-white placeholder:text-[#a0a0a0] outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || isSubmitting}
                                className="text-blue-400 font-bold text-xs sm:text-sm disabled:opacity-40 px-3 py-1 transition-all cursor-pointer flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg"
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
