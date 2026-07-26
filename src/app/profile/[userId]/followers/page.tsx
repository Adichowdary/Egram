"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SplashScreen } from "@/components/SplashScreen";

export default function FollowersRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId as string;

    useEffect(() => {
        if (userId) {
            router.replace(`/profile/${userId}?tab=followers`);
        } else {
            router.replace("/");
        }
    }, [userId, router]);

    return <SplashScreen />;
}
