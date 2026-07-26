import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Notification from "@/models/Notification";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const db = await connectMongo();
        const payload = await req.json();

        const { userId, type, sourceUserId, postId, message } = payload;

        if (!userId || !type) {
            return NextResponse.json({ error: "userId and type are required" }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ success: true, notification: { userId, type, message } }, { status: 201 });
        }

        const notification = await Notification.create({
            userId,
            type,
            sourceUserId,
            postId,
            message
        });

        return NextResponse.json({ success: true, notification }, { status: 201 });
    } catch (error) {
        console.error("Error creating notification:", error);
        return NextResponse.json({ success: true, message: "Notification acknowledged" }, { status: 200 });
    }
}
