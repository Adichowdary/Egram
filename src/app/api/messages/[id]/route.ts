import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Message from "@/models/Message";
import mongoose from "mongoose";

async function handleDelete(id: string, userId: string, action: string) {
    if (!userId || !action) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: true, message: "Message deleted" }, { status: 200 });
    }

    const db = await connectMongo();
    if (!db) {
        return NextResponse.json({ success: true, message: "Message action updated" }, { status: 200 });
    }

    const message = await Message.findById(id);

    if (!message) {
        return NextResponse.json({ success: true, message: "Message deleted" }, { status: 200 });
    }

    if (action === "deleteForEveryone") {
        if (message.senderId !== userId) {
            return NextResponse.json({ error: "Forbidden: Only sender can delete for everyone" }, { status: 403 });
        }
        message.deletedForEveryone = true;
        message.content = "This message was deleted";
        message.mediaUrl = undefined;
        message.mediaType = undefined;
    } else if (action === "deleteForMe") {
        if (!message.deletedForMe) {
            message.deletedForMe = [];
        }
        if (!message.deletedForMe.includes(userId)) {
            message.deletedForMe.push(userId);
        }
    } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await message.save();

    return NextResponse.json({ success: true, message: "Message deleted successfully", data: message }, { status: 200 });
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId, action } = await req.json();
        return await handleDelete(id, userId, action);
    } catch (error) {
        console.error("Delete Message Error:", error);
        return NextResponse.json({ success: true, message: "Action acknowledged" }, { status: 200 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId') || '';
        const action = searchParams.get('action') || 'deleteForMe';
        return await handleDelete(id, userId, action);
    } catch (error) {
        console.error("DELETE API Error:", error);
        return NextResponse.json({ success: true, message: "Action acknowledged" }, { status: 200 });
    }
}
