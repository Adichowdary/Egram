import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Story from '@/models/Story';

// In-memory fallback cache so stories work even if DB connection is offline/unconfigured
const inMemoryStories: Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    mediaUrl: string;
    caption?: string;
    createdAt: string;
    expiresAt: string;
}> = [];

export async function GET() {
    try {
        const now = new Date();
        const conn = await connectMongo();
        let rawStories: any[] = [];

        if (conn) {
            rawStories = await Story.find({ expiresAt: { $gt: now } }).sort({ createdAt: -1 }).lean();
        }

        // Combine DB stories and active in-memory fallback stories
        const combined = [...rawStories, ...inMemoryStories.filter(s => new Date(s.expiresAt) > now)];
        const userIds = Array.from(new Set(combined.map(s => s.userId)));

        let userAvatarMap: Record<string, { avatarUrl?: string; name?: string }> = {};
        if (conn && userIds.length > 0) {
            try {
                const User = (await import('@/models/User')).default;
                const dbUsers = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid avatarUrl name').lean();
                dbUsers.forEach((u: any) => {
                    userAvatarMap[u.firebaseUid] = { avatarUrl: u.avatarUrl, name: u.name };
                });
            } catch (e) {
                console.error("Error populating story user avatars:", e);
            }
        }

        // Group stories by userId for Instagram-style story bubbles
        const userStoryMap = new Map<string, any>();

        for (const story of combined) {
            const uId = story.userId;
            const storyObj = {
                id: story._id?.toString() || story.id,
                mediaUrl: story.mediaUrl,
                caption: story.caption || "",
                timestamp: story.createdAt
            };

            const latestUser = userAvatarMap[uId];
            const resolvedAvatar = latestUser?.avatarUrl || story.userAvatar || "";
            const resolvedName = latestUser?.name || story.userName;

            if (!userStoryMap.has(uId)) {
                userStoryMap.set(uId, {
                    id: uId,
                    name: resolvedName,
                    avatar: resolvedAvatar,
                    hasUnseen: true,
                    stories: [storyObj]
                });
            } else {
                userStoryMap.get(uId).stories.push(storyObj);
            }
        }

        const result = Array.from(userStoryMap.values());
        return NextResponse.json({ stories: result });
    } catch (error: any) {
        console.error("Error fetching stories:", error);
        return NextResponse.json({ stories: [] });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, userName, userAvatar, mediaUrl, caption } = body;

        if (!userId || !userName || !mediaUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const conn = await connectMongo();
        let createdStory = null;

        if (conn) {
            createdStory = await Story.create({
                userId,
                userName,
                userAvatar: userAvatar || "",
                mediaUrl,
                caption: caption || "",
                createdAt: now,
                expiresAt
            });
        }

        const storyObj = {
            id: createdStory?._id?.toString() || `story_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            userId,
            userName,
            userAvatar: userAvatar || "",
            mediaUrl,
            caption: caption || "",
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        };

        inMemoryStories.unshift(storyObj);

        return NextResponse.json({ success: true, story: storyObj }, { status: 201 });
    } catch (error: any) {
        console.error("Error posting story:", error);
        return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
    }
}
