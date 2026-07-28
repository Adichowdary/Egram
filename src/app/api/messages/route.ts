import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import Group from "@/models/Group";
import User from "@/models/User";
import { sendSupabaseMessage, fetchSupabaseMessages, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const db = await connectMongo();
        const { senderId, receiverId, groupId, content, mediaUrl, mediaType } = await req.json();

        if (!senderId || (!receiverId && !groupId)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        
        const finalContent = content !== undefined && content !== null ? content : '';
        if (!finalContent && !mediaUrl) {
             return NextResponse.json({ error: "Message must have content or media" }, { status: 400 });
        }

        if (receiverId && db) {
            const sender = await User.findOne({ firebaseUid: senderId }).select('blockedUsers').lean();
            const receiver = await User.findOne({ firebaseUid: receiverId }).select('blockedUsers').lean();

            if (sender && sender.blockedUsers && sender.blockedUsers.includes(receiverId)) {
                return NextResponse.json({ error: "You have blocked this user" }, { status: 403 });
            }

            if (receiver && receiver.blockedUsers && receiver.blockedUsers.includes(senderId)) {
                return NextResponse.json({ error: "You are blocked by this user" }, { status: 403 });
            }
        }

        // 1. Create in MongoDB (if connected)
        let newMessage = null;
        if (db) {
            newMessage = await Message.create({ senderId, receiverId, groupId, content: finalContent, mediaUrl, mediaType });
        }

        // 2. Dual-sync to Supabase for Realtime WebSockets delivery
        if (isSupabaseConfigured()) {
            sendSupabaseMessage({
                senderId,
                receiverId,
                groupId,
                content: finalContent,
                mediaUrl,
                mediaType
            }).catch(err => console.error("Error syncing message to Supabase:", err));
        }

        // Asynchronous non-blocking notifications for speed
        if (db) {
            if (groupId) {
                Group.findById(groupId).select('memberIds name').lean().then(group => {
                    if (group && group.memberIds) {
                        const notifyPromises = group.memberIds
                            .filter((id: string) => id !== senderId)
                            .map((memberId: string) =>
                                Notification.create({
                                    userId: memberId,
                                    type: 'group_message',
                                    sourceUserId: senderId,
                                    message: `New message in ${group.name}`
                                })
                            );
                        Promise.all(notifyPromises).catch(err => console.error("Group notification error:", err));
                    }
                }).catch(err => console.error("Error finding group for notify:", err));
            } else if (receiverId) {
                const notificationMsg = finalContent.length > 50 ? finalContent.substring(0, 47) + '...' : (finalContent || 'Sent a photo');
                Notification.create({
                    userId: receiverId,
                    type: 'message',
                    sourceUserId: senderId,
                    message: notificationMsg
                }).catch(err => console.error("Notification create error:", err));
            }
        }

        const returnData = newMessage || { senderId, receiverId, groupId, content: finalContent, mediaUrl, mediaType, createdAt: new Date() };
        return NextResponse.json({ success: true, data: returnData }, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const user1 = searchParams.get('user1') || undefined;
        const user2 = searchParams.get('user2') || undefined;
        const groupId = searchParams.get('groupId') || undefined;

        if (!groupId && (!user1 || !user2)) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // 1. Parallel MongoDB Query
        const mongoPromise = (async () => {
            try {
                const db = await connectMongo();
                if (!db) return [];
                if (groupId) {
                    return await Message.find({ groupId }).sort({ createdAt: 1 }).lean();
                } else {
                    return await Message.find({
                        $or: [
                            { senderId: user1, receiverId: user2 },
                            { senderId: user2, receiverId: user1 }
                        ]
                    }).sort({ createdAt: 1 }).lean();
                }
            } catch (err) {
                console.error("Mongo fetch error:", err);
                return [];
            }
        })();

        // 2. Parallel Supabase Query
        const supaPromise = isSupabaseConfigured()
            ? fetchSupabaseMessages({ user1, user2, groupId }).catch(() => [])
            : Promise.resolve([]);

        // Execute concurrently to eliminate sequential waiting
        const [supaRes, mongoRes] = await Promise.all([supaPromise, mongoPromise]);

        if (supaRes && supaRes.length > 0) {
            const formatted = supaRes.map(m => ({
                _id: m.mongo_id || m.id,
                senderId: m.sender_id,
                receiverId: m.receiver_id,
                groupId: m.group_id,
                content: m.content,
                mediaUrl: m.media_url,
                mediaType: m.media_type,
                isRead: m.is_read,
                createdAt: m.created_at
            }));
            return NextResponse.json({ success: true, data: formatted }, { status: 200 });
        }

        return NextResponse.json({ success: true, data: mongoRes || [] }, { status: 200 });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }
}

