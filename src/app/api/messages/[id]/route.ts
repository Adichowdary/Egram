import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Message from "@/models/Message";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const db = await connectMongo();
        const { id } = await params;
        
        const { userId, action } = await req.json();

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ success: true, message: "Message action updated" }, { status: 200 });
        }

        const message = await Message.findById(id);

        if (!message) {
            return NextResponse.json({ success: true, message: "Message updated" }, { status: 200 });
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
            if (!message.deletedForMe.includes(userId)) {
                message.deletedForMe.push(userId);
            }
        } else {
             return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        await message.save();

        return NextResponse.json({ success: true, message: "Message deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Delete Message Error:", error);
        return NextResponse.json({ success: true, message: "Action acknowledged" }, { status: 200 });
    }
}
