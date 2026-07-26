"use client";

import { useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export function PresenceHandler() {
  const [user, setUser] = useState<User | null>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    const updatePresence = async (status: boolean) => {
      try {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL || "",
          isOnline: status,
          lastActive: serverTimestamp(),
        }, { merge: true });
      } catch (error) {
        console.warn("Presence update failed:", error);
      }
    };

    updatePresence(true);
    
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible";
      updatePresence(isVisible);
    };

    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        updatePresence(true);
      }
    }, 60000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user?.uid]);

  return null;
}
