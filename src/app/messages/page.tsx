"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "@/lib/firebase";
import { Sidebar } from "@/components/Sidebar";
import { CreateMeetModal } from "@/components/CreateMeetModal";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { CreatePostModal } from "@/components/CreatePostModal";
import { GroupInfoModal } from "@/components/GroupInfoModal";
import { MobileNav } from "@/components/MobileNav";
import { Send, User as UserIcon, MessageSquare, ImageIcon, Clock, Users, Plus, Info, Camera, Paperclip, FileText, MoreVertical, Trash, Trash2, X, Download, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useScreenshotDetection } from "@/hooks/useScreenshotDetection";
import { useRouter } from "next/navigation";
import { subscribeToChatMessages } from "@/lib/supabase";
import { ContactsSkeleton, MessagesSkeleton } from "@/components/ChatSkeleton";

// Utility to convert file to base64 string as fallback
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// Image compressor utility to ensure instant base64 sending without payload errors or hanging on HEIC/HEIF camera photos
const compressImage = (file: File, maxWidth = 1000, quality = 0.75): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) {
                resolve("");
                return;
            }
            if (!file.type.startsWith('image/')) {
                resolve(dataUrl);
                return;
            }

            const img = new Image();
            let isResolved = false;

            const timeout = setTimeout(() => {
                if (!isResolved) {
                    isResolved = true;
                    resolve(dataUrl);
                }
            }, 500);

            img.onload = () => {
                if (isResolved) return;
                isResolved = true;
                clearTimeout(timeout);
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width || 800;
                    let height = img.height || 600;
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                } catch {
                    resolve(dataUrl);
                }
            };
            img.onerror = () => {
                if (!isResolved) {
                    isResolved = true;
                    clearTimeout(timeout);
                    resolve(dataUrl);
                }
            };
            img.src = dataUrl;
        };
        reader.onerror = () => resolve("");
    });
};

const messageCache = new Map<string, any[]>();

const getStoredMessages = (cacheKey: string): any[] => {
    if (typeof window === "undefined") return [];
    try {
        const item = localStorage.getItem(`chat_msg_${cacheKey}`);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
};

const setStoredMessages = (cacheKey: string, msgs: any[]) => {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(`chat_msg_${cacheKey}`, JSON.stringify(msgs.slice(-50)));
    } catch {}
};

function AvatarImage({ src, name, className = "w-full h-full rounded-full object-cover", fallbackClassName = "w-full h-full rounded-full flex items-center justify-center bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30" }: { src?: string; name: string; className?: string; fallbackClassName?: string }) {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [src]);

    const getInitials = (n: string) => n ? n.split(' ').map(x => x[0]).join('').substring(0, 2).toUpperCase() : '?';

    if (src && !failed) {
        return (
            <img 
                src={src} 
                alt={name} 
                className={className} 
                onError={() => setFailed(true)} 
            />
        );
    }

    return (
        <div className={fallbackClassName}>
            {getInitials(name)}
        </div>
    );
}

export default function MessagesPage() {
    const [user, setUser] = useState<FirebaseUser | null>(() => typeof window !== "undefined" && auth ? auth.currentUser : null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'direct' | 'groups'>('direct');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [loadingContacts, setLoadingContacts] = useState(true);
    const [chatWallpapers, setChatWallpapers] = useState<Record<string, string>>({});
    const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
    const [allowScreenshotNotifications, setAllowScreenshotNotifications] = useState(true);
    const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
    
    // Media attachment state
    const [chatFile, setChatFile] = useState<File | null>(null);
    const [chatFilePreview, setChatFilePreview] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    
    // Lightbox state for viewing full-size images
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    // Active message actions menu ID
    const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (auth.currentUser) {
            fetchContacts(auth.currentUser.uid);
            fetchGroups(auth.currentUser.uid);
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.push("/login");
            }
        });

        const handleProfileUpdate = () => {
            if (auth?.currentUser?.uid) {
                fetchContacts(auth.currentUser.uid);
            }
        };

        window.addEventListener("userProfileUpdated", handleProfileUpdate);

        return () => {
            unsubscribe();
            window.removeEventListener("userProfileUpdated", handleProfileUpdate);
        };
    }, [router]);

    const fetchContacts = async (uid: string) => {
        try {
            const res = await fetch(`/api/users/${uid}?t=${Date.now()}`, { cache: "no-store" });
            if (res.ok) {
                const userData = await res.json();
                if (userData.chatWallpapers) setChatWallpapers(userData.chatWallpapers);
                if (userData.blockedUsers) setBlockedUsers(userData.blockedUsers);
                if (userData.allowScreenshotNotifications !== undefined) {
                    setAllowScreenshotNotifications(userData.allowScreenshotNotifications);
                }

                const contactIds = Array.from(new Set([...(userData.following || []), ...(userData.followers || [])])) as string[];
                const fetchUrl = contactIds.length > 0 
                    ? `/api/users?ids=${contactIds.join(',')}&t=${Date.now()}` 
                    : `/api/users?t=${Date.now()}`;

                const contactsRes = await fetch(fetchUrl, { cache: "no-store" });
                if (contactsRes.ok) {
                    const contactsResult = await contactsRes.json();
                    const filtered = (contactsResult.data || []).filter((u: any) => u.firebaseUid !== uid);
                    setConversations(filtered);
                }
            }
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setLoadingContacts(false);
        }
    };

    const fetchGroups = async (uid: string) => {
        try {
            const res = await fetch(`/api/groups?userId=${uid}`);
            if (res.ok) {
                const data = await res.json();
                setGroups(data.data || []);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    };

    const fetchMessages = async (contactId: string, isGroup: boolean = false, isInitial: boolean = false) => {
        if (!user) return;
        const cacheKey = isGroup ? `group_${contactId}` : `user_${contactId}`;

        if (isInitial) {
            const memoryCached = messageCache.get(cacheKey);
            const localCached = memoryCached || getStoredMessages(cacheKey);
            if (localCached && localCached.length > 0) {
                setMessages(localCached);
                setTimeout(scrollToBottom, 10);
            } else {
                setMessages([]);
                setLoadingMessages(true);
            }
        }

        try {
            const url = isGroup
                ? `/api/messages?groupId=${contactId}`
                : `/api/messages?user1=${user.uid}&user2=${contactId}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const fetched: any[] = data.data || [];
                messageCache.set(cacheKey, fetched);
                setStoredMessages(cacheKey, fetched);
                setMessages(fetched);
                if (isInitial) {
                    setTimeout(scrollToBottom, 50);
                }
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            if (isInitial) setLoadingMessages(false);
        }
    };


    useEffect(() => {
        let unsubscribeRealtime = () => {};

        if (selectedUser && user) {
            fetchMessages(selectedUser.firebaseUid, false, true);
            
            // Supabase Realtime instant WebSocket subscription
            unsubscribeRealtime = subscribeToChatMessages(
                { user1: user.uid, user2: selectedUser.firebaseUid },
                (newMsg) => {
                    const formatted = {
                        _id: newMsg.mongo_id || newMsg.id,
                        senderId: newMsg.sender_id,
                        receiverId: newMsg.receiver_id,
                        groupId: newMsg.group_id,
                        content: newMsg.content,
                        mediaUrl: newMsg.media_url,
                        mediaType: newMsg.media_type,
                        isRead: newMsg.is_read,
                        createdAt: newMsg.created_at
                    };
                    setMessages(prev => {
                        const exists = prev.some(m => (m._id || m.id) === formatted._id);
                        if (exists) return prev;
                        return [...prev, formatted];
                    });
                    setTimeout(scrollToBottom, 50);
                }
            );

            const interval = setInterval(() => {
                fetchMessages(selectedUser.firebaseUid, false, false);
            }, 5000);

            return () => {
                unsubscribeRealtime();
                clearInterval(interval);
            };
        } else if (selectedGroup && user) {
            fetchMessages(selectedGroup._id, true, true);
            
            // Supabase Realtime instant WebSocket subscription for Group
            unsubscribeRealtime = subscribeToChatMessages(
                { groupId: selectedGroup._id },
                (newMsg) => {
                    const formatted = {
                        _id: newMsg.mongo_id || newMsg.id,
                        senderId: newMsg.sender_id,
                        receiverId: newMsg.receiver_id,
                        groupId: newMsg.group_id,
                        content: newMsg.content,
                        mediaUrl: newMsg.media_url,
                        mediaType: newMsg.media_type,
                        isRead: newMsg.is_read,
                        createdAt: newMsg.created_at
                    };
                    setMessages(prev => {
                        const exists = prev.some(m => (m._id || m.id) === formatted._id);
                        if (exists) return prev;
                        return [...prev, formatted];
                    });
                    setTimeout(scrollToBottom, 50);
                }
            );

            const interval = setInterval(() => {
                fetchMessages(selectedGroup._id, true, false);
            }, 5000);

            return () => {
                unsubscribeRealtime();
                clearInterval(interval);
            };
        }
    }, [selectedUser, selectedGroup, user]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setChatFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => setChatFilePreview(event.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setChatFilePreview(null);
            }
        }
    };

    const clearChatFile = () => {
        setChatFile(null);
        setChatFilePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
        if (docInputRef.current) docInputRef.current.value = '';
    };

    const handleDeleteMessage = async (messageId: string, action: 'deleteForMe' | 'deleteForEveryone') => {
        if (!user) return;
        setOpenMessageMenuId(null);

        setMessages(prev => prev.map(msg => {
            const mId = msg._id || msg.id;
            if (mId === messageId) {
                if (action === 'deleteForEveryone') {
                    return { ...msg, deletedForEveryone: true, content: "This message was deleted", mediaUrl: undefined, mediaType: undefined };
                } else {
                    return { ...msg, deletedForMe: [...(msg.deletedForMe || []), user.uid] };
                }
            }
            return msg;
        }));

        try {
            await fetch(`/api/messages/${messageId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, action })
            });
        } catch (error) {
            console.error("Failed to delete message", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !chatFile) || !user || (!selectedUser && !selectedGroup) || isSending) return;

        const content = newMessage.trim();
        const currentFile = chatFile;
        const currentPreview = chatFilePreview;

        setNewMessage("");
        clearChatFile();
        setIsSending(true);

        const receiverId = selectedGroup ? undefined : selectedUser.firebaseUid;
        const groupId = selectedGroup ? selectedGroup._id : undefined;

        const tempMessageId = "temp_" + Date.now().toString();
        const isImage = currentFile ? currentFile.type.startsWith('image/') : false;
        const tempMessage = {
            _id: tempMessageId,
            id: tempMessageId,
            senderId: user.uid,
            receiverId,
            groupId,
            content: content,
            mediaUrl: currentPreview || (currentFile ? URL.createObjectURL(currentFile) : undefined),
            mediaType: currentFile ? (isImage ? 'image' : 'pdf') : undefined,
            createdAt: new Date().toISOString(),
            isSending: true
        };

        setMessages(prev => [...prev, tempMessage]);
        setTimeout(scrollToBottom, 50);

        try {
            let mediaUrl: string | undefined = undefined;
            let mediaType: string | undefined = undefined;

            if (currentFile) {
                mediaType = isImage ? 'image' : 'pdf';

                try {
                    const formData = new FormData();
                    formData.append("file", currentFile);
                    formData.append("bucket", "chat-media");

                    const uploadRes = await fetch("/api/upload", {
                        method: "POST",
                        body: formData
                    });

                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        mediaUrl = uploadData.url;
                    } else {
                        mediaUrl = isImage ? await compressImage(currentFile) : await fileToBase64(currentFile);
                    }
                } catch (storageErr) {
                    console.warn("Upload endpoint fallback:", storageErr);
                    mediaUrl = isImage ? await compressImage(currentFile) : await fileToBase64(currentFile);
                }
            }

            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: user.uid,
                    receiverId,
                    groupId,
                    content,
                    mediaUrl,
                    mediaType
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 403) {
                    alert(errorData.error || "Action forbidden");
                }
                setMessages(prev => prev.filter(m => (m._id || m.id) !== tempMessageId));
            } else {
                const responseData = await res.json();
                if (responseData.data) {
                    setMessages(prev => prev.map(m => (m._id || m.id) === tempMessageId ? responseData.data : m));
                } else {
                    fetchMessages(selectedGroup ? selectedGroup._id : selectedUser.firebaseUid, !!selectedGroup);
                }
            }
        } catch (error) {
            console.error("Send message error:", error);
            setMessages(prev => prev.filter(m => (m._id || m.id) !== tempMessageId));
        } finally {
            setIsSending(false);
        }
    };

    const handleScreenshotDetected = async () => {
        if (!user || (!selectedUser && !selectedGroup)) return;
        const content = "[System]: 📸 User took a screenshot!";
        const receiverId = selectedGroup ? undefined : selectedUser.firebaseUid;
        const groupId = selectedGroup ? selectedGroup._id : undefined;

        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: user.uid,
                    receiverId,
                    groupId,
                    content
                })
            });
            fetchMessages(selectedGroup ? selectedGroup._id : selectedUser.firebaseUid, !!selectedGroup);
        } catch (error) {
            console.error("Failed to send screenshot notification:", error);
        }
    };

    useScreenshotDetection(allowScreenshotNotifications && !!(selectedUser || selectedGroup), handleScreenshotDetected);

    const handleBlockUser = async (targetId: string, action: 'block' | 'unblock') => {
        if (!user) return;
        try {
            const res = await fetch(`/api/users/${user.uid}/block`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: targetId, action })
            });

            if (res.ok) {
                const data = await res.json();
                setBlockedUsers(data.blockedUsers);
            }
        } catch (error) {
            console.error("Failed to block/unblock user:", error);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!user || !selectedGroup) return;
        try {
            const res = await fetch(`/api/groups/${selectedGroup._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'remove_member',
                    userId: memberId,
                    requesterId: user.uid
                })
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedGroup(data.group);
                setGroups(prev => prev.map(g => g._id === data.group._id ? data.group : g));
            }
        } catch (error) {
            console.error("Failed to remove member:", error);
        }
    };

    const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || (!selectedUser && !selectedGroup)) return;

        setIsUploadingWallpaper(true);
        const targetId = selectedGroup ? selectedGroup._id : selectedUser.firebaseUid;

        try {
            let downloadURL = "";
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("bucket", "wallpapers");
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    downloadURL = uploadData.url;
                } else {
                    downloadURL = await fileToBase64(file);
                }
            } catch {
                downloadURL = await fileToBase64(file);
            }

            const newWallpapers = { ...chatWallpapers, [targetId]: downloadURL };
            setChatWallpapers(newWallpapers);

            await fetch(`/api/users/${user.uid}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chatWallpapers: newWallpapers })
            });
        } catch (error) {
            console.error("Failed to upload wallpaper", error);
        } finally {
            setIsUploadingWallpaper(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const getInitials = (name: string | null) => {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
    };

    if (!user) return null;

    const activeChatEntity = selectedGroup || selectedUser;
    const activeChatId = selectedGroup ? selectedGroup._id : (selectedUser ? selectedUser.firebaseUid : null);

    return (
        <div className="app-container">
            <Sidebar
                user={user}
                setIsModalOpen={setIsModalOpen}
                setIsPostModalOpen={setIsPostModalOpen}
                getInitials={getInitials}
            />

            <main className="main-content" style={{ display: "flex", padding: "1rem" }}>
                <div className="messaging-container card glass" style={{ display: "flex", width: "100%", height: "calc(100vh - 2rem)", borderRadius: "16px", overflow: "hidden" }}>

                    {/* Contacts & Groups Sidebar */}
                    <div className={`contacts-list ${activeChatId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[320px] border-r border-[var(--card-border)] bg-zinc-950/40`}>
                        <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid var(--card-border)" }}>
                            <div className="flex items-center justify-between mb-3">
                                <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Messages</h2>
                                {activeTab === 'groups' && (
                                    <button
                                        onClick={() => setIsCreateGroupModalOpen(true)}
                                        className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full transition-colors flex items-center justify-center bg-zinc-800/80 border border-zinc-700"
                                        title="Create New Group"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Direct vs Groups Tab */}
                            <div className="flex bg-[var(--accent-bg)] p-1 rounded-xl border border-[var(--card-border)] overflow-hidden shadow-inner">
                                <button
                                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'direct' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-light)] hover:bg-[var(--card-hover)]'}`}
                                    onClick={() => setActiveTab('direct')}
                                >
                                    Direct
                                </button>
                                <button
                                    className={`flex-1 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all ${activeTab === 'groups' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--text-light)] hover:bg-[var(--card-hover)]'}`}
                                    onClick={() => setActiveTab('groups')}
                                >
                                    Groups
                                </button>
                            </div>
                        </div>

                        <div style={{ overflowY: "auto", flex: 1 }}>
                            {activeTab === 'direct' ? (
                                loadingContacts ? (
                                    <ContactsSkeleton />
                                ) : conversations.length === 0 ? (
                                    <div style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
                                        <div className="w-14 h-14 rounded-full bg-[var(--primary-bg)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4 border border-[var(--primary)]/20">
                                            <Users className="w-7 h-7" />
                                        </div>
                                        <h3 className="font-bold text-[var(--text-dark)] mb-1 text-sm">No contacts yet</h3>
                                        <p style={{ color: "var(--text-light)", marginBottom: "1.2rem", fontSize: "0.85rem" }}>Follow friends to chat!</p>
                                        <Link href="/search" className="inline-block bg-[var(--primary)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-[var(--primary)]/30 hover:scale-[1.02] transition-transform">
                                            Find People
                                        </Link>
                                    </div>
                                ) : (
                                    conversations.map(contact => (
                                        <div
                                            key={contact.firebaseUid}
                                            onClick={() => { setSelectedUser(contact); setSelectedGroup(null); }}
                                            style={{
                                                padding: "0.9rem 1.2rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.9rem",
                                                cursor: "pointer",
                                                background: selectedUser?.firebaseUid === contact.firebaseUid ? "var(--card-hover)" : "transparent",
                                                borderBottom: "1px solid var(--card-border)",
                                                transition: "background 0.2s"
                                            }}
                                            className="hover:bg-[var(--card-hover)]"
                                        >
                                            <div className="avatar cursor-pointer" style={{ width: "42px", height: "42px", flexShrink: 0 }}>
                                                <AvatarImage src={contact.avatarUrl} name={contact.name} />
                                            </div>
                                            <div style={{ overflow: "hidden", flex: 1 }}>
                                                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", color: blockedUsers.includes(contact.firebaseUid) ? 'var(--text-light)' : 'inherit' }}>
                                                    {contact.name} {blockedUsers.includes(contact.firebaseUid) && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded ml-1 border border-red-500/30">Blocked</span>}
                                                </h3>
                                                <p className="text-xs text-zinc-400 truncate">{contact.bio || `@${contact.name?.toLowerCase().replace(/\s+/g, '')}`}</p>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                groups.length === 0 ? (
                                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-light)", fontSize: "0.85rem" }}>
                                        You are not in any groups yet.
                                    </div>
                                ) : (
                                    groups.map(group => (
                                        <div
                                            key={group._id}
                                            onClick={() => { setSelectedGroup(group); setSelectedUser(null); }}
                                            style={{
                                                padding: "0.9rem 1.2rem",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.9rem",
                                                cursor: "pointer",
                                                background: selectedGroup?._id === group._id ? "var(--card-hover)" : "transparent",
                                                borderBottom: "1px solid var(--card-border)",
                                                transition: "background 0.2s"
                                            }}
                                            className="hover:bg-[var(--card-hover)]"
                                        >
                                            <div className="avatar cursor-pointer" style={{ width: "42px", height: "42px", flexShrink: 0 }}>
                                                {group.avatarUrl ? (
                                                    <img src={group.avatarUrl} alt={group.name} className="w-full h-full rounded-xl object-cover" />
                                                ) : (
                                                    <div className="avatar-placeholder w-full h-full rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                                                        <Users size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ overflow: "hidden", flex: 1 }}>
                                                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{group.name}</h3>
                                                <p className="text-xs text-zinc-500">{group.memberIds?.length || 0} members</p>
                                            </div>
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>

                    {/* Main Chat Conversation Area */}
                    <div
                        className={`chat-area relative ${!activeChatId ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}
                        style={{
                            background: "var(--background)",
                            backgroundImage: activeChatId && chatWallpapers[activeChatId]
                                ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.75)), url(${chatWallpapers[activeChatId]})`
                                : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        {activeChatId ? (
                            <>
                                {/* Hidden File Inputs */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleWallpaperUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <input
                                    type="file"
                                    ref={imageInputRef}
                                    onChange={handleChatFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <input
                                    type="file"
                                    ref={docInputRef}
                                    onChange={handleChatFileChange}
                                    accept="application/pdf,.doc,.docx,.txt,.zip,.rar,image/*"
                                    className="hidden"
                                />

                                {/* Chat Top Header */}
                                <div style={{ padding: "0.9rem 1.2rem", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", gap: "0.9rem", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)" }}>
                                    <button
                                        className="md:hidden p-2.5 -ml-2 text-zinc-300 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full active:bg-white/10"
                                        onClick={() => { setSelectedGroup(null); setSelectedUser(null); }}
                                        aria-label="Back to contacts"
                                    >
                                        <span className="text-xl font-black">&larr;</span>
                                    </button>
                                    <div className="avatar cursor-pointer" style={{ width: "42px", height: "42px", flexShrink: 0 }}>
                                        {selectedGroup ? (
                                            activeChatEntity.avatarUrl ? (
                                                <AvatarImage src={activeChatEntity.avatarUrl} name={activeChatEntity.name} className="w-full h-full rounded-xl object-cover" />
                                            ) : (
                                                <div className="avatar-placeholder w-full h-full flex items-center justify-center font-bold rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                                                    <Users size={20} />
                                                </div>
                                            )
                                        ) : (
                                            <AvatarImage src={activeChatEntity.avatarUrl} name={activeChatEntity.name} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{activeChatEntity.name}</h3>
                                        {selectedGroup && (
                                            <p className="text-xs text-zinc-400">{selectedGroup.memberIds?.length || 0} members</p>
                                        )}
                                    </div>

                                    <div className="flex-1 flex justify-end gap-1.5 items-center">
                                        {selectedGroup && (
                                            <button
                                                onClick={() => setIsGroupInfoModalOpen(true)}
                                                className="p-2.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                                                title="Group Details & Members"
                                            >
                                                <Info className="w-5 h-5" />
                                            </button>
                                        )}
                                        {selectedUser && (
                                            <button
                                                onClick={() => handleBlockUser(selectedUser.firebaseUid, blockedUsers.includes(selectedUser.firebaseUid) ? 'unblock' : 'block')}
                                                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all min-h-[44px] shadow-sm ${blockedUsers.includes(selectedUser.firebaseUid) ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' : 'bg-zinc-800/80 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-zinc-700'}`}
                                            >
                                                {blockedUsers.includes(selectedUser.firebaseUid) ? 'Unblock' : 'Block User'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                const newValue = !allowScreenshotNotifications;
                                                setAllowScreenshotNotifications(newValue);
                                                fetch(`/api/users/${user.uid}`, {
                                                    method: "PUT",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ allowScreenshotNotifications: newValue })
                                                });
                                            }}
                                            className={`p-2.5 rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] ${allowScreenshotNotifications ? 'text-[var(--primary)] hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/10'}`}
                                            title={allowScreenshotNotifications ? "Screenshot Notifications: ON" : "Screenshot Notifications: OFF"}
                                        >
                                            <Camera className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploadingWallpaper}
                                            className="p-2.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                                            title="Change Chat Wallpaper"
                                        >
                                            {isUploadingWallpaper ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <ImageIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* 24-hour Expiry Banner */}
                                <div className="w-full flex justify-center mt-3 mb-1 opacity-85">
                                    <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-full px-3.5 py-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 shadow-md">
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Messages expire 24 hours after being sent.</span>
                                    </div>
                                </div>

                                {/* Messages Timeline List */}
                                <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.2rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                                    {loadingMessages ? (
                                        <MessagesSkeleton />
                                    ) : (
                                        messages.map((msg) => {
                                            if (msg.deletedForMe && msg.deletedForMe.includes(user.uid)) return null;

                                            const isMine = msg.senderId === user.uid;
                                            const senderDetails = selectedGroup && !isMine ? conversations.find(c => c.firebaseUid === msg.senderId) : null;
                                            const msgId = msg._id || msg.id;
                                            const isMenuOpen = openMessageMenuId === msgId;

                                            return (
                                                <motion.div
                                                    key={msgId}
                                                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 450, damping: 28 }}
                                                    className="relative group flex items-end gap-2"
                                                    style={{ justifyContent: isMine ? "flex-end" : "flex-start" }}
                                                >
                                                    {selectedGroup && !isMine && (
                                                        <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 mb-1 border border-zinc-700">
                                                            <AvatarImage src={senderDetails?.avatarUrl} name={senderDetails?.name || '?'} />
                                                        </div>
                                                    )}

                                                {/* Left Action Menu (For Receiver) */}
                                                {!isMine && (
                                                    <div className="relative mb-1">
                                                        <button
                                                            onClick={() => setOpenMessageMenuId(isMenuOpen ? null : msgId)}
                                                            className="text-zinc-400 hover:text-white p-2 min-w-[40px] min-h-[40px] rounded-full hover:bg-zinc-800/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                                                            title="Message Options"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {isMenuOpen && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                                                    className="absolute left-0 bottom-full mb-2 w-52 sm:w-60 bg-zinc-950 border border-zinc-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col p-1.5 origin-bottom-left"
                                                                >
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msgId, 'deleteForMe')}
                                                                        className="w-full text-left px-4 py-3 text-xs sm:text-sm text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-3 font-extrabold transition-all cursor-pointer min-h-[46px]"
                                                                    >
                                                                        <Trash size={16} /> Delete for me
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}

                                                {/* Message Bubble Container */}
                                                <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                                                    {selectedGroup && !isMine && senderDetails && (
                                                        <span className="text-[11px] text-zinc-400 font-semibold ml-2 mb-0.5">{senderDetails.name}</span>
                                                    )}

                                                    <div
                                                        style={{
                                                            padding: "0.75rem 1.1rem",
                                                            borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                            background: isMine ? "var(--primary)" : "var(--card-border)",
                                                            color: isMine ? "white" : "var(--text-dark)",
                                                            fontSize: "0.92rem",
                                                            boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
                                                        }}
                                                        className="relative group/bubble overflow-hidden"
                                                    >
                                                        {msg.deletedForEveryone ? (
                                                            <span className="italic opacity-70 flex items-center gap-2 text-xs">
                                                                <Trash size={13} /> This message was deleted
                                                            </span>
                                                        ) : (
                                                            <>
                                                                {/* Image Attachment */}
                                                                {msg.mediaUrl && msg.mediaType === 'image' && (
                                                                    <div className="relative mb-2 rounded-xl overflow-hidden cursor-pointer group/img max-w-sm">
                                                                        <img
                                                                            src={msg.mediaUrl}
                                                                            alt="attachment"
                                                                            className="max-w-full rounded-xl object-cover hover:scale-[1.02] transition-transform duration-200 bg-black/20"
                                                                            style={{ maxHeight: '260px' }}
                                                                            onClick={() => setLightboxImage(msg.mediaUrl)}
                                                                            loading="lazy"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                                            <span className="text-xs font-semibold text-white bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-sm">Click to view</span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* File / Document Attachment */}
                                                                {msg.mediaUrl && msg.mediaType !== 'image' && (
                                                                    <a
                                                                        href={msg.mediaUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        download
                                                                        className="flex items-center gap-2.5 p-3 bg-black/25 rounded-xl mb-2 hover:bg-black/40 transition-colors border border-white/10 text-white"
                                                                    >
                                                                        <FileText size={22} className={isMine ? "text-white" : "text-blue-400"} />
                                                                        <div className="flex flex-col overflow-hidden pr-2">
                                                                            <span className="text-xs font-bold truncate">Shared File / Document</span>
                                                                            <span className="text-[10px] opacity-80 flex items-center gap-1 underline">
                                                                                <Download size={11} /> Click to download file
                                                                            </span>
                                                                        </div>
                                                                    </a>
                                                                )}

                                                                {/* Message Text Content */}
                                                                {msg.content && <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>}

                                                                {/* Sending Indicator */}
                                                                {msg.isSending && (
                                                                    <div className="flex items-center gap-1 justify-end mt-1 text-[10px] opacity-75">
                                                                        <span>Sending...</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Action Menu (For Sender) */}
                                                {isMine && (
                                                    <div className="relative mb-1">
                                                        <button
                                                            onClick={() => setOpenMessageMenuId(isMenuOpen ? null : msgId)}
                                                            className="text-zinc-400 hover:text-white p-2 min-w-[40px] min-h-[40px] rounded-full hover:bg-zinc-800/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-sm"
                                                            title="Message Options"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {isMenuOpen && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                                                                    className="absolute right-0 bottom-full mb-2 w-56 sm:w-64 bg-zinc-950 border border-zinc-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col p-1.5 origin-bottom-right"
                                                                >
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msgId, 'deleteForMe')}
                                                                        className="w-full text-left px-4 py-3.5 text-xs sm:text-sm text-zinc-200 hover:bg-zinc-800/90 rounded-xl flex items-center gap-3 font-bold transition-all cursor-pointer min-h-[46px]"
                                                                    >
                                                                        <Trash2 size={16} className="text-amber-400" /> Delete for me
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msgId, 'deleteForEveryone')}
                                                                        className="w-full text-left px-4 py-3.5 text-xs sm:text-sm text-red-400 hover:bg-red-500/15 rounded-xl flex items-center gap-3 font-black border-t border-zinc-800/90 mt-1 pt-3.5 transition-all cursor-pointer min-h-[46px]"
                                                                    >
                                                                        <Trash size={16} className="text-red-500" /> Delete for everyone
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                )}
                                            </motion.div>
                                         );
                                     }))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Interactive Message Input Bar */}
                                <div style={{ padding: "0.8rem 1.2rem", borderTop: "1px solid var(--card-border)", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
                                    {selectedUser && blockedUsers.includes(selectedUser.firebaseUid) ? (
                                        <div className="text-center py-2 text-xs text-red-400 italic bg-red-500/10 border border-red-500/20 rounded-xl">
                                            You have blocked this user. Unblock to send messages.
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                                            
                                            {/* Attached Media Preview Box */}
                                            {chatFile && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 10 }}
                                                    className="flex items-center justify-between p-2.5 bg-zinc-900/90 border border-blue-500/40 rounded-2xl shadow-lg"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {chatFilePreview ? (
                                                            <img src={chatFilePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-blue-500/30 flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                                                                <FileText size={22} />
                                                            </div>
                                                        )}
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-xs font-semibold text-white truncate">{chatFile.name}</span>
                                                            <span className="text-[10px] text-zinc-400">{(chatFile.size / 1024).toFixed(1)} KB • Ready to send</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={clearChatFile}
                                                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-full transition-colors ml-2"
                                                        title="Remove attachment"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </motion.div>
                                            )}

                                            {/* Text Input Row */}
                                            <div className="flex gap-2.5 items-center">
                                                <div className="flex gap-1.5 items-center bg-[var(--background)] rounded-2xl px-3.5 border border-[var(--card-border)] flex-1 min-h-[52px] sm:min-h-[56px] shadow-inner">
                                                    
                                                    {/* Image Attachment Icon Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => imageInputRef.current?.click()}
                                                        className="p-2 text-zinc-400 hover:text-blue-400 rounded-full transition-colors flex items-center justify-center min-w-[42px] min-h-[42px]"
                                                        title="Attach Image"
                                                    >
                                                        <ImageIcon className="w-5.5 h-5.5" />
                                                    </button>

                                                    {/* Document Attachment Icon Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => docInputRef.current?.click()}
                                                        className="p-2 text-zinc-400 hover:text-purple-400 rounded-full transition-colors flex items-center justify-center min-w-[42px] min-h-[42px]"
                                                        title="Attach PDF Document"
                                                    >
                                                        <Paperclip className="w-5.5 h-5.5" />
                                                    </button>

                                                    <input
                                                        type="text"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        placeholder={chatFile ? "Add a caption..." : "Type a message..."}
                                                        className="flex-1 py-3.5 px-2 bg-transparent text-[var(--text-dark)] outline-none border-none text-sm sm:text-base font-medium placeholder:text-zinc-500"
                                                    />
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={(!newMessage.trim() && !chatFile) || isSending}
                                                    className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
                                                        (newMessage.trim() || chatFile) && !isSending
                                                            ? "bg-[var(--primary)] text-white hover:scale-105 active:scale-95 shadow-blue-500/30 font-bold"
                                                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
                                                    }`}
                                                >
                                                    {isSending ? (
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Send size={20} />
                                                    )}
                                                </button>
                                            </div>

                                        </form>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--text-light)" }}>
                                <MessageSquare size={48} style={{ marginBottom: "1rem", opacity: 0.4 }} />
                                <h2 className="text-base font-semibold">Select a conversation or group to start messaging</h2>
                            </div>
                        )}
                    </div>

                </div>
            </main>

            {/* Lightbox Image Preview Modal */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxImage(null)}
                        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-50"
                        >
                            <X size={28} />
                        </button>
                        <img
                            src={lightboxImage}
                            alt="Enlarged preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <CreateMeetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                user={user}
                getInitials={getInitials}
            />

            <CreateGroupModal
                isOpen={isCreateGroupModalOpen}
                onClose={() => setIsCreateGroupModalOpen(false)}
                user={user}
                contacts={conversations}
                onGroupCreated={(newGroup) => {
                    setGroups(prev => [newGroup, ...prev]);
                    setActiveTab('groups');
                    setSelectedGroup(newGroup);
                    setSelectedUser(null);
                }}
                getInitials={getInitials}
            />

            <CreatePostModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                user={user}
            />

            <GroupInfoModal
                isOpen={isGroupInfoModalOpen}
                onClose={() => setIsGroupInfoModalOpen(false)}
                group={selectedGroup}
                user={user}
                onRemoveMember={handleRemoveMember}
                getInitials={getInitials}
                conversations={conversations}
            />

            <MobileNav onOpenCreatePost={() => setIsPostModalOpen(true)} onOpenCreateMeet={() => setIsModalOpen(true)} currentUserId={user?.uid} />
        </div>
    );
}
