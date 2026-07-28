import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { User as UserIcon, Info } from "lucide-react";
import { useRooms } from "@/hooks/useRooms";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RightSidebarProps {
    user: User;
    handleSignOut: () => void;
    getInitials: (name: string | null) => string;
}

const sidebarMongoCache = new Map<string, any>();
const sidebarFirestoreCache = new Map<string, any>();

export function RightSidebar({ user, handleSignOut, getInitials }: RightSidebarProps) {
    const { rooms, loading } = useRooms();

    const [userData, setUserData] = useState<any>(() => user?.uid ? sidebarFirestoreCache.get(user.uid) || null : null);
    const [mongoProfile, setMongoProfile] = useState<any>(() => user?.uid ? sidebarMongoCache.get(user.uid) || null : null);

    const fetchUserData = async () => {
        if (!user?.uid) return;
        try {
            // Fetch MongoDB user profile for primary display
            const res = await fetch(`/api/users/${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                sidebarMongoCache.set(user.uid, data);
                setMongoProfile(data);
            }

            // Fetch Firestore doc for legacy/streak data
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const fData = userSnap.data();
                sidebarFirestoreCache.set(user.uid, fData);
                setUserData(fData);
            }
        } catch (err) {
            console.error("Failed to fetch user data for sidebar", err);
        }
    };

    useEffect(() => {
        fetchUserData();

        const handleProfileUpdate = () => fetchUserData();
        window.addEventListener("userProfileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("userProfileUpdated", handleProfileUpdate);
    }, [user?.uid]);

    const displayName = mongoProfile?.name || userData?.displayName || user.displayName || (user.email ? user.email.split('@')[0] : "Student");
    const avatarUrl = mongoProfile?.avatarUrl || user.photoURL;

    return (
        <aside className="right-sidebar">
            {/* Mini Profile */}
            <div className="mini-profile">
                <div className="profile-avatar overflow-hidden rounded-full w-14 h-14 border-2 border-[var(--primary)] border-opacity-30">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Your Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[var(--primary-bg)] text-[var(--primary)] flex items-center justify-center font-bold text-xl uppercase">
                            {getInitials(displayName)}
                        </div>
                    )}
                </div>
                <div className="profile-info">
                    <span className="username truncate max-w-[150px] text-[var(--text-dark)] font-bold">{displayName}</span>
                    <span className="fullname flex items-center gap-1 text-[var(--text-light)]">
                        Student •
                        <div className="flex items-center gap-1 relative group cursor-pointer ml-1 whitespace-nowrap">
                            <span style={{ color: "#ff6b6b", fontWeight: "bold" }}>{mongoProfile?.currentStreak || userData?.streak || 0} Day Streak</span>
                            <span className="inline-flex items-center justify-center animate-pulse drop-shadow-[0_0_8px_rgba(255,107,107,0.8)] filter leading-none text-sm">🔥</span>
                            <Info className="w-3.5 h-3.5 text-[var(--text-light)] group-hover:text-[var(--text-dark)] transition-colors opacity-50" />

                            {/* Tooltip */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 p-3 bg-[var(--card-bg)] text-xs text-[var(--text-dark)] rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] shadow-2xl border border-[var(--card-border)] pointer-events-none text-center">
                                <span className="font-semibold text-[#ff6b6b] block mb-1">Streak Life: 24 Hours</span>
                                Maintain your streak by logging in or posting daily!
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent border-b-[var(--card-border)]"></div>
                            </div>
                        </div>
                    </span>
                </div>
                <button onClick={handleSignOut} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-extrabold text-xs sm:text-sm rounded-xl transition-all active:scale-95 shadow-sm min-h-[38px] cursor-pointer">
                    Logout
                </button>
            </div>

            {/* Meet Rooms Widget */}
            <div className="rooms-widget">
                <div className="widget-header">
                    <h4>Upcoming Study Rooms</h4>
                    <span>See All</span>
                </div>

                <div className="rooms-list">
                    {loading ? (
                        <div className="text-sm text-gray-500">Loading rooms...</div>
                    ) : rooms.length === 0 ? (
                        <div className="text-sm text-gray-500">No upcoming rooms. Create one!</div>
                    ) : (
                        rooms.slice(0, 3).map((room) => (
                            <div key={room.id} className="meet-item glass cursor-pointer hover:border-primary transition-colors">
                                <div className="meet-info">
                                    <h5 className="truncate max-w-[160px]">{room.topic}</h5>
                                    <span className="flex items-center gap-1">
                                        <div className="avatar-small w-4 h-4 text-[10px] inline-flex mr-1">{room.hostInitials}</div>
                                        {room.hostName.split(' ')[0]} • {room.scheduleTime}
                                    </span>
                                </div>
                                <a href={room.meetLink} target="_blank" rel="noreferrer" className="btn-join no-underline">Join</a>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </aside>
    );
}
