import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import Post from "@/models/Post";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectMongo();
        const { id } = await params;
        
        // Use a header or search param to pass the requesting user's ID
        const url = new URL(req.url);
        const userId = url.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const post = await Post.findById(id);

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        if (post.author !== userId) {
            return NextResponse.json({ error: "Forbidden: You can only delete your own posts" }, { status: 403 });
        }

        await post.deleteOne();

        return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Delete Post Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
