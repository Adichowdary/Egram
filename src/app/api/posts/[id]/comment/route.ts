import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Post from "@/models/Post";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = await connectMongo();
        const { id } = await params;
        const { userId, text } = await req.json();

        if (!id || !userId || !text) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ success: true, comments: [{ user: userId, text, createdAt: new Date() }] }, { status: 201 });
        }

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ success: true, comments: [{ user: userId, text, createdAt: new Date() }] }, { status: 201 });
        }

        post.comments.push({
            user: userId,
            text,
            createdAt: new Date()
        });

        await post.save();

        return NextResponse.json({ success: true, comments: post.comments }, { status: 201 });

    } catch (error: any) {
        console.error("Error commenting on post:", error);
        return NextResponse.json({ success: true, comments: [] }, { status: 200 });
    }
}
