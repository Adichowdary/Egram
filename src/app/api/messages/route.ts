import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Message from "@/models/Message";
import Notification from "@/models/Notification";
import Group from "@/models/Group";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectMongo();
        const { senderId, receiverId, groupId, content, mediaUrl, mediaType } = await req.json();

        if (!senderId || (!receiverId && !groupId)) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        
        // Ensure content is a string, even if empty (when only media is sent)
        const finalContent = content || (mediaUrl ? '' : undefined);
        if (finalContent === undefined) {
             return NextResponse.json({ error: "Message must have content or media" }, { status: 400 });
        }

        // Check for blocks if it's a direct message
        if (receiverId) {
            const sender = await User.findOne({ firebaseUid: senderId }).select('blockedUsers').lean();
            const receiver = await User.findOne({ firebaseUid: receiverId }).select('blockedUsers').lean();

            if (sender && sender.blockedUsers && sender.blockedUsers.includes(receiverId)) {
                return NextResponse.json({ error: "You have blocked this user" }, { status: 403 });
            }

            if (receiver && receiver.blockedUsers && receiver.blockedUsers.includes(senderId)) {
                return NextResponse.json({ error: "You are blocked by this user" }, { status: 403 });
            }
        }

        const newMessage = await Message.create({ senderId, receiverId, groupId, content: finalContent, mediaUrl, mediaType });

        if (groupId) {
            // Group message notification
            const group = await Group.findById(groupId).select('memberIds name').lean();
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
                await Promise.all(notifyPromises);
            }
        } else if (receiverId) {
            // Direct message notification
            await Notification.create({
                userId: receiverId,
                type: 'message',
                sourceUserId: senderId,
                message: content.length > 50 ? content.substring(0, 47) + '...' : content
            });
        }

        return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await connectMongo();
        const { searchParams } = new URL(req.url);
        const user1 = searchParams.get('user1');
        const user2 = searchParams.get('user2');
        const groupId = searchParams.get('groupId');

        if (!groupId && (!user1 || !user2)) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        let messages;
        if (groupId) {
            messages = await Message.find({ groupId }).sort({ createdAt: 1 }).lean();
        } else {
            messages = await Message.find({
                $or: [
                    { senderId: user1, receiverId: user2 },
                    { senderId: user2, receiverId: user1 }
                ]
            }).sort({ createdAt: 1 }).lean();
        }

        return NextResponse.json({ success: true, data: messages }, { status: 200 });
    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
