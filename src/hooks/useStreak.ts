import { useState, useEffect } from "react";
import { User } from "firebase/auth";

export function useStreak(user: User | null) {
    const [streak, setStreak] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setStreak(0);
            setLoading(false);
            return;
        }

        const updateStreak = async () => {
            const sessionKey = `streak_updated_${user.uid}_${new Date().toDateString()}`;
            if (typeof window !== "undefined" && sessionStorage.getItem(sessionKey)) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/users/${user.uid}/streak`, {
                    method: "POST"
                });
                
                if (res.ok) {
                    const data = await res.json();
                    setStreak(data.currentStreak || 0);
                    if (typeof window !== "undefined") {
                        sessionStorage.setItem(sessionKey, "true");
                    }
                }
            } catch (error) {
                console.error("Error updating streak:", error);
            } finally {
                setLoading(false);
            }
        };

        updateStreak();
    }, [user?.uid]);

    return { streak, loading };
}
