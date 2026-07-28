import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Post from "@/models/Post";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = await connectMongo();
        const { id } = await params;

        if (!db || !id) {
            return NextResponse.json({ success: true, comments: [] }, { status: 200 });
        }

        const post = await Post.findById(id).lean();
        if (!post) {
            return NextResponse.json({ success: true, comments: [] }, { status: 200 });
        }

        const User = (await import("@/models/User")).default;
        const userIds = Array.from(new Set((post.comments || []).map((c: any) => c.user)));
        const users = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid name email avatarUrl').lean();
        const userMap = new Map(users.map((u: any) => [u.firebaseUid, u]));

        const comments = (post.comments || []).map((c: any) => {
            const u = userMap.get(c.user);
            const resolvedName = (u?.name && u.name !== "Student") ? u.name : (c.userName && c.userName !== "Student" ? c.userName : (u?.email?.split('@')[0] || "User"));
            return {
                _id: c._id?.toString() || `c-${Date.now()}`,
                user: c.user,
                userName: resolvedName,
                avatarUrl: u?.avatarUrl || "",
                text: c.text,
                createdAt: c.createdAt
            };
        });

        return NextResponse.json({ success: true, comments }, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ success: true, comments: [] }, { status: 200 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = await connectMongo();
        const { id } = await params;
        const { userId, text, userName } = await req.json();

        if (!id || !userId || !text) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const fallbackName = userName && userName !== "Student" ? userName : "User";

        if (!db) {
            return NextResponse.json({ success: true, comments: [{ _id: `c-${Date.now()}`, user: userId, userName: fallbackName, text, createdAt: new Date() }] }, { status: 201 });
        }

        const User = (await import("@/models/User")).default;
        let userDoc = await User.findOne({ firebaseUid: userId });

        let authorName = fallbackName;
        if (userDoc) {
            if (userDoc.name && userDoc.name !== "Student") {
                authorName = userDoc.name;
            } else if (userName && userName !== "Student") {
                authorName = userName;
                userDoc.name = userName;
                await userDoc.save();
            } else if (userDoc.email && !userDoc.email.includes("student")) {
                authorName = userDoc.email.split("@")[0];
                userDoc.name = authorName;
                await userDoc.save();
            }
        }

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ success: true, comments: [{ _id: `c-${Date.now()}`, user: userId, userName: authorName, text, createdAt: new Date() }] }, { status: 201 });
        }

        post.comments.push({
            user: userId,
            userName: authorName,
            text,
            createdAt: new Date()
        });

        await post.save();

        const userIds = Array.from(new Set(post.comments.map((c: any) => c.user)));
        const users = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid name avatarUrl email').lean();
        const userMap = new Map(users.map((u: any) => [u.firebaseUid, u]));

        const formattedComments = post.comments.map((c: any) => {
            const u = userMap.get(c.user);
            const resolvedName = (u?.name && u.name !== "Student") ? u.name : (c.userName && c.userName !== "Student" ? c.userName : (u?.email?.split('@')[0] || "User"));
            return {
                _id: c._id?.toString(),
                user: c.user,
                userName: resolvedName,
                avatarUrl: u?.avatarUrl || "",
                text: c.text,
                createdAt: c.createdAt
            };
        });

        return NextResponse.json({ success: true, comments: formattedComments }, { status: 201 });

    } catch (error: any) {
        console.error("Error commenting on post:", error);
        return NextResponse.json({ success: true, comments: [] }, { status: 200 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = await connectMongo();
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const commentId = searchParams.get('commentId');
        const userId = searchParams.get('userId');

        if (!id || !commentId || !userId) {
            return NextResponse.json({ error: "Missing required query parameters" }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ success: true, comments: [] }, { status: 200 });
        }

        const post = await Post.findById(id);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Find comment to delete
        const comment = post.comments.id(commentId) || post.comments.find((c: any) => c._id?.toString() === commentId);
        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 });
        }

        // Check if user is comment author OR post author
        if (comment.user !== userId && post.author !== userId) {
            return NextResponse.json({ error: "Unauthorized to delete this comment" }, { status: 403 });
        }

        // Remove comment
        post.comments = post.comments.filter((c: any) => c._id?.toString() !== commentId);
        await post.save();

        const User = (await import("@/models/User")).default;
        const userIds = Array.from(new Set(post.comments.map((c: any) => c.user)));
        const users = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid name avatarUrl email').lean();
        const userMap = new Map(users.map((u: any) => [u.firebaseUid, u]));

        const formattedComments = post.comments.map((c: any) => {
            const u = userMap.get(c.user);
            const resolvedName = (u?.name && u.name !== "Student") ? u.name : (c.userName && c.userName !== "Student" ? c.userName : (u?.email?.split('@')[0] || "User"));
            return {
                _id: c._id?.toString(),
                user: c.user,
                userName: resolvedName,
                avatarUrl: u?.avatarUrl || "",
                text: c.text,
                createdAt: c.createdAt
            };
        });

        return NextResponse.json({ success: true, comments: formattedComments }, { status: 200 });
    } catch (error: any) {
        console.error("Error deleting comment:", error);
        return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }
}
