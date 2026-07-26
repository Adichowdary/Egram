import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = await connectMongo();
        const userId = (await params).id;

        if (!userId || !db) {
            return NextResponse.json({ success: true, notifications: [] }, { status: 200 });
        }

        const rawNotifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();

        const sourceUserIds = Array.from(new Set(rawNotifications.map((n: any) => n.sourceUserId).filter(Boolean)));
        const sourceUsers = await User.find({ firebaseUid: { $in: sourceUserIds } })
            .select('name avatarUrl email firebaseUid')
            .lean();

        const userMap = new Map(sourceUsers.map((u: any) => [u.firebaseUid, u]));
        const notifications = rawNotifications.map((n: any) => ({
            ...n,
            sourceUserId: n.sourceUserId ? (userMap.get(n.sourceUserId) || { name: 'User', avatarUrl: '' }) : null
        }));

        return NextResponse.json({ success: true, notifications }, { status: 200 });

    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ success: true, notifications: [] }, { status: 200 });
    }
}
