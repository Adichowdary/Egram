import Link from "next/link";
import { UserPlus, UserCheck, Share2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface UserProfile {
    uid: string;
    displayName: string | null;
    photoURL: string | null;
    bio?: string;
    followersCount?: number;
    followingCount?: number;
    streak?: number;
}

interface UserCardProps {
    profile: UserProfile;
    isFollowing?: boolean;
    onFollow?: (uid: string) => void;
    showFollowButton?: boolean;
}

export function UserCard({ profile, isFollowing, onFollow, showFollowButton = true }: UserCardProps) {
    const { addToast } = useToast();

    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const shareUrl = `${window.location.origin}/profile/${profile.uid}`;
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({
                    title: `${profile.displayName || 'User'}'s Profile on Egram`,
                    text: `Check out ${profile.displayName || 'User'}'s profile on Egram!`,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // User cancelled or share API error, fallback to clipboard write
            }
        }
        if (typeof navigator !== "undefined" && navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
            addToast("Profile link copied to clipboard!", "success");
        }
    };

    return (
        <div
            className="rounded-2xl p-4 flex items-center justify-between transition-all duration-200 hover:shadow-md"
            style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
            }}
        >
            <Link href={`/profile/${profile.uid}`} className="flex items-center gap-4 flex-1 min-w-0">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 p-0.5 flex-shrink-0">
                    <div
                        className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                        style={{ background: "var(--card-bg)", border: "2px solid var(--card-bg)" }}
                    >
                        {profile.photoURL ? (
                            <img src={profile.photoURL} alt={profile.displayName || "User"} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl font-black uppercase" style={{ color: "var(--primary)" }}>
                                {getInitials(profile.displayName)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0">
                    <h3 className="font-bold text-[15px] truncate leading-tight" style={{ color: "var(--text-dark)" }}>
                        {profile.displayName || "Anonymous User"}
                    </h3>
                    {profile.bio && (
                        <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--text-light)" }}>
                            {profile.bio}
                        </p>
                    )}
                    <div className="flex gap-3 mt-1.5">
                        <span className="text-[11px] font-semibold" style={{ color: "var(--text-light)" }}>
                            <span style={{ color: "var(--text-dark)", fontWeight: 700 }}>{profile.followersCount || 0}</span> followers
                        </span>
                        <span className="text-[11px] font-semibold" style={{ color: "var(--text-light)" }}>
                            <span style={{ color: "var(--text-dark)", fontWeight: 700 }}>{profile.followingCount || 0}</span> following
                        </span>
                        {profile.streak && profile.streak > 0 ? (
                            <span className="text-[11px] font-bold text-orange-500">🔥 {profile.streak}</span>
                        ) : null}
                    </div>
                </div>
            </Link>

            <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <button
                    onClick={handleShare}
                    title="Share Profile"
                    className="p-2 rounded-xl text-xs font-bold transition-all active:scale-95 text-zinc-400 hover:text-[var(--primary)] bg-white/5 hover:bg-white/10"
                >
                    <Share2 className="w-4 h-4" />
                </button>

                {showFollowButton && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onFollow?.(profile.uid);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
                        style={isFollowing ? {
                            background: "var(--accent-bg)",
                            color: "var(--text-light)",
                            border: "1px solid var(--card-border)",
                        } : {
                            background: "var(--primary)",
                            color: "#fff",
                        }}
                    >
                        {isFollowing ? (
                            <><UserCheck className="w-3.5 h-3.5" /> Following</>
                        ) : (
                            <><UserPlus className="w-3.5 h-3.5" /> Follow</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
