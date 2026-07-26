"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { SplashScreen } from "@/components/SplashScreen";

export default function ProfileRedirect() {
    const router = useRouter();

    useEffect(() => {
        let isResolved = false;

        // Safety fallback timer so loading never hangs indefinitely
        const safetyTimer = setTimeout(() => {
            if (!isResolved) {
                isResolved = true;
                if (auth?.currentUser) {
                    router.replace(`/profile/${auth.currentUser.uid}`);
                } else {
                    router.replace("/login");
                }
            }
        }, 2000);

        if (typeof window !== "undefined" && auth?.currentUser) {
            isResolved = true;
            clearTimeout(safetyTimer);
            router.replace(`/profile/${auth.currentUser.uid}`);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!isResolved) {
                isResolved = true;
                clearTimeout(safetyTimer);
                if (user) {
                    router.replace(`/profile/${user.uid}`);
                } else {
                    router.replace("/login");
                }
            }
        });

        return () => {
            clearTimeout(safetyTimer);
            unsubscribe();
        };
    }, [router]);

    return <SplashScreen />;
}
