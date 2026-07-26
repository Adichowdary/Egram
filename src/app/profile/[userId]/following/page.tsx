"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SplashScreen } from "@/components/SplashScreen";

export default function FollowingRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    useEffect(() => {
        if (userId) {
            router.replace(`/profile/${userId}?tab=following`);
        } else {
            router.replace("/");
        }
    }, [userId, router]);

    return <SplashScreen />;
}
