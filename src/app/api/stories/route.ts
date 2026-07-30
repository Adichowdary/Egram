import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import Story from '@/models/Story';

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
            rawStories = await Story.find({ expiresAt: { $gt: now } })
                .select('_id userId userName userAvatar mediaUrl mediaType caption views likes createdAt expiresAt')
                .sort({ createdAt: -1 })
                .limit(40)
                .lean();
        }

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

        const userStoryMap = new Map<string, any>();

        for (const story of combined) {
            const uId = story.userId;
            const isVideo = story.mediaType === 'video' || !!story.mediaUrl?.match(/\.(mp4|webm|mov|ogg|m4v)/i) || story.mediaUrl?.includes('/video/');
            const storyObj = {
                id: story._id?.toString() || story.id,
                mediaUrl: story.mediaUrl,
                mediaType: isVideo ? 'video' : 'image',
                caption: story.caption || "",
                views: story.views || [],
                likes: story.likes || [],
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
        return NextResponse.json(
            { stories: result },
            {
                headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15' }
            }
        );
    } catch (error: any) {
        console.error("Error fetching stories:", error);
        return NextResponse.json({ stories: [] });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, userName, userAvatar, mediaUrl, mediaType, caption } = body;

        const resolvedUserName = userName || "Student";

        if (!userId || !mediaUrl) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const isVideo = mediaType === 'video' || !!mediaUrl.match(/\.(mp4|webm|mov|ogg|m4v)/i) || mediaUrl.includes('/video/');

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        let createdStory: any = null;
        try {
            const conn = await connectMongo();
            if (conn) {
                createdStory = await Story.create({
                    userId,
                    userName: resolvedUserName,
                    userAvatar: userAvatar || "",
                    mediaUrl,
                    mediaType: isVideo ? 'video' : 'image',
                    caption: caption || "",
                    views: [],
                    likes: [],
                    createdAt: now,
                    expiresAt
                });
            }
        } catch (dbErr) {
            console.warn("MongoDB story creation failed, using in-memory store fallback:", dbErr);
        }

        const storyObj = {
            id: createdStory?._id?.toString() || `story_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            userId,
            userName: resolvedUserName,
            userAvatar: userAvatar || "",
            mediaUrl,
            mediaType: isVideo ? 'video' : 'image',
            caption: caption || "",
            views: [],
            likes: [],
            createdAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        };

        inMemoryStories.unshift(storyObj as any);

        return NextResponse.json({ success: true, story: storyObj }, { status: 201 });
    } catch (error: any) {
        console.error("Error posting story:", error);
        return NextResponse.json({ error: "Failed to create story" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { storyId, action, userId, userName, userAvatar } = body;

        if (!storyId || !action || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const conn = await connectMongo();
        if (!conn) {
            return NextResponse.json({ success: true });
        }

        const story = await Story.findById(storyId);
        if (!story) {
            return NextResponse.json({ error: "Story not found" }, { status: 404 });
        }

        if (action === 'view') {
            const alreadyViewed = story.views?.some((v: any) => v.userId === userId);
            if (!alreadyViewed) {
                story.views.push({
                    userId,
                    name: userName || "User",
                    avatar: userAvatar || "",
                    viewedAt: new Date()
                });
                await story.save();
            }
        } else if (action === 'like') {
            const likeIndex = story.likes?.findIndex((l: any) => l.userId === userId);
            if (likeIndex > -1) {
                story.likes.splice(likeIndex, 1);
            } else {
                story.likes.push({
                    userId,
                    name: userName || "User",
                    avatar: userAvatar || ""
                });
            }
            await story.save();
        }

        return NextResponse.json({
            success: true,
            views: story.views || [],
            likes: story.likes || []
        });
    } catch (error: any) {
        console.error("Error updating story action:", error);
        return NextResponse.json({ error: "Failed to update story" }, { status: 500 });
    }
}
