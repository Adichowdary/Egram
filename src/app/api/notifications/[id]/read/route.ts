import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = await connectMongo();
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "notifId is required" }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ success: true, isRead: true }, { status: 200 });
        }

        const notification = await Notification.findByIdAndUpdate(
            id,
            { $set: { isRead: true } },
            { new: true }
        );

        return NextResponse.json({ success: true, notification }, { status: 200 });

    } catch (error) {
        console.error("Error marking notification read:", error);
        return NextResponse.json({ success: true, isRead: true }, { status: 200 });
    }
}
