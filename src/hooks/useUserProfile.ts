import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";

const profileCache = new Map<string, any>();

export function useUserProfile(user: FirebaseUser | null) {
    const uid = user?.uid || "";
    
    const [profile, setProfile] = useState<any>(() => {
        if (!uid) return null;
        return profileCache.get(uid) || {
            name: user?.displayName || user?.email?.split('@')[0] || "Student",
            avatarUrl: user?.photoURL || "",
            bio: "",
            currentStreak: 0,
        };
    });

    const fetchProfile = async () => {
        if (!uid) return;
        try {
            const res = await fetch(`/api/users/${uid}?t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                const updated = {
                    name: data.name || user?.displayName || user?.email?.split('@')[0] || "Student",
                    avatarUrl: data.avatarUrl || user?.photoURL || "",
                    bio: data.bio || "",
                    currentStreak: data.currentStreak || data.streak || 0,
                    followersCount: data.followersCount || 0,
                    followingCount: data.followingCount || 0,
                };
                profileCache.set(uid, updated);
                setProfile(updated);
            }
        } catch (err) {
            console.error("Error fetching profile hook:", err);
        }
    };

    useEffect(() => {
        if (!uid) return;

        // If user prop photoURL or displayName changed, seed initial
        if (user?.photoURL || user?.displayName) {
            const cached = profileCache.get(uid);
            if (!cached) {
                profileCache.set(uid, {
                    name: user.displayName || user.email?.split('@')[0] || "Student",
                    avatarUrl: user.photoURL || "",
                    bio: "",
                    currentStreak: 0,
                });
            }
        }

        fetchProfile();

        const handleUpdate = (e: Event) => {
            const customEvt = e as CustomEvent;
            if (customEvt?.detail) {
                const cached = profileCache.get(uid) || {};
                const merged = {
                    ...cached,
                    ...(customEvt.detail.avatarUrl ? { avatarUrl: customEvt.detail.avatarUrl } : {}),
                    ...(customEvt.detail.name ? { name: customEvt.detail.name } : {}),
                };
                profileCache.set(uid, merged);
                setProfile((prev: any) => ({ ...prev, ...merged }));
            }
            fetchProfile();
        };

        window.addEventListener("userProfileUpdated", handleUpdate);
        return () => window.removeEventListener("userProfileUpdated", handleUpdate);
    }, [uid]);

    return {
        profile,
        userPhoto: profile?.avatarUrl || user?.photoURL || "",
        userName: profile?.name || user?.displayName || user?.email?.split('@')[0] || "Student",
        userStreak: profile?.currentStreak || 0,
        refetch: fetchProfile,
    };
}
