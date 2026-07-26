"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { CenterFeed } from "@/components/CenterFeed";
import { CreateMeetModal } from "@/components/CreateMeetModal";
import { CreatePostModal } from "@/components/CreatePostModal";

import { AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/SplashScreen";
import { PageTransition } from "@/components/PageTransition";
import { PresenceHandler } from "@/components/PresenceHandler";

export default function Home() {
  const [user, setUser] = useState<User | null>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
  const [loading, setLoading] = useState<boolean>(() => !(typeof window !== "undefined" && auth?.currentUser));
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (!currentUser) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);



  const handleSignOut = async () => {
    await signOut(auth);
  };

  const getInitials = (nameOrEmail: string | null) => {
    if (!nameOrEmail) return "U";
    return nameOrEmail.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <AnimatePresence>
        {loading && <SplashScreen key="splash" />}
      </AnimatePresence>

      {!loading && user && (
        <PageTransition>
          <Sidebar
            user={user}
            setIsModalOpen={setIsModalOpen}
            setIsPostModalOpen={setIsPostModalOpen}
            getInitials={getInitials}
          />

          <main className="main-content">
            <CenterFeed user={user} />

            <RightSidebar
              user={user}
              handleSignOut={handleSignOut}
              getInitials={getInitials}
            />
          </main>

          <CreateMeetModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            user={user}
            getInitials={getInitials}
          />

          <CreatePostModal
            isOpen={isPostModalOpen}
            onClose={() => setIsPostModalOpen(false)}
            user={user}
          />
        </PageTransition>
      )}
    </>
  );
}
