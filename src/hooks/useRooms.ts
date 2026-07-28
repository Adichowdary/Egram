import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface StudyRoom {
    id: string;
    topic: string;
    scheduleTime: string;
    hostId: string;
    hostName: string;
    hostInitials: string;
    meetLink: string;
    createdAt: any;
}

let globalRoomsCache: StudyRoom[] = [];

export function useRooms() {
    const [rooms, setRooms] = useState<StudyRoom[]>(globalRoomsCache);
    const [loading, setLoading] = useState(globalRoomsCache.length === 0);

    useEffect(() => {
        try {
            const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const roomsData: StudyRoom[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    roomsData.push({
                        id: doc.id,
                        topic: data.topic || "Study Focus",
                        scheduleTime: data.scheduleTime || "Now",
                        hostId: data.hostId || "",
                        hostName: data.hostName || "Student",
                        hostInitials: data.hostInitials || "ST",
                        meetLink: data.meetLink || `https://meet.jit.si/Egram-Study-${doc.id}`,
                        createdAt: data.createdAt,
                    });
                });
                globalRoomsCache = roomsData;
                setRooms(roomsData);
                setLoading(false);
            }, (error) => {
                console.error("Firestore rooms listener notice:", error);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (e) {
            console.error("Failed to setup rooms listener", e);
            setLoading(false);
        }
    }, []);

    const createRoom = async (roomData: Omit<StudyRoom, "id" | "createdAt" | "meetLink">, customMeetLink?: string) => {
        const uniqueRoomId = `Egram-${roomData.topic.replace(/[^a-zA-Z0-9]/g, "")}-${Math.random().toString(36).substring(2, 8)}`;
        const finalMeetLink = customMeetLink || `https://meet.jit.si/${uniqueRoomId}`;

        const newRoomObj: StudyRoom = {
            id: "room_" + Date.now(),
            ...roomData,
            meetLink: finalMeetLink,
            createdAt: new Date().toISOString()
        };

        // Optimistically update local cache so room appears instantly without server delay
        globalRoomsCache = [newRoomObj, ...globalRoomsCache];
        setRooms([...globalRoomsCache]);

        // Attempt async sync to Firestore in background without blocking UI
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 59);

            const docPromise = addDoc(collection(db, "rooms"), {
                ...roomData,
                meetLink: finalMeetLink,
                createdAt: serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAt)
            });

            // Fast 2.5s race timeout
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500));
            await Promise.race([docPromise, timeoutPromise]).catch(() => {});
            return true;
        } catch (error) {
            console.warn("Background Firestore sync skipped, using local room state:", error);
            return true; // Still return true so user experience is instant and smooth
        }
    };

    return { rooms, loading, createRoom };
}
