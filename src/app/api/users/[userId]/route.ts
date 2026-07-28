import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/models/User";
import Follower from "@/models/Follower";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    let userId = "";
    try {
        userId = (await params).userId;
        const db = await connectMongo();

        if (!db || !userId) {
            return NextResponse.json({
                firebaseUid: userId || "unknown",
                name: "Student",
                bio: "",
                avatarUrl: "",
                followersCount: 0,
                followingCount: 0,
                currentStreak: 0
            }, { status: 200 });
        }

        let user = await User.findOne({ firebaseUid: userId }).lean();

        if (!user) {
            return NextResponse.json({
                firebaseUid: userId,
                name: "Student",
                bio: "",
                avatarUrl: "",
                followersCount: 0,
                followingCount: 0,
                currentStreak: 0
            }, { status: 200 });
        }

        // Live count verification from Follower collection
        const liveFollowersCount = await Follower.countDocuments({ followingId: userId });
        const liveFollowingCount = await Follower.countDocuments({ followerId: userId });

        return NextResponse.json({
            ...user,
            followersCount: liveFollowersCount,
            followingCount: liveFollowingCount
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching user:", error);
        return NextResponse.json({
            firebaseUid: userId || "unknown",
            name: "Student",
            bio: "",
            avatarUrl: "",
            followersCount: 0,
            followingCount: 0,
            currentStreak: 0
        }, { status: 200 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const db = await connectMongo();
        const userId = (await params).userId;
        const body = await req.json();

        if (!db) {
            return NextResponse.json({ message: "Updated locally" }, { status: 200 });
        }

        let user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            user = await User.create({
                firebaseUid: userId,
                email: body.email || `${userId}@egram.student`,
                name: body.name || "Student",
                bio: body.bio || "",
                avatarUrl: body.avatarUrl || ""
            });
        }

        const dbUpdate: any = { $set: {} };

        if (body.name && body.name !== user.name) {
            const now = new Date();
            const currentHistory = user.usernameHistory || [];
            dbUpdate.$set.usernameHistory = [...currentHistory, { name: body.name, changedAt: now }];
        }

        const allowedUpdates = [
            "bio", "name", "username", "avatarUrl", "coverImage", 
            "website", "skills", "college", "branch", "year", 
            "allowScreenshotNotifications"
        ];
        for (const key of allowedUpdates) {
            if (body[key] !== undefined) {
                dbUpdate.$set[key] = body[key];
            }
        }

        if (body.chatWallpapers !== undefined) {
            dbUpdate.$set.chatWallpapers = body.chatWallpapers;
        }

        if (Object.keys(dbUpdate.$set).length === 0) {
            delete dbUpdate.$set;
        }

        user = await User.findOneAndUpdate(
            { firebaseUid: userId },
            dbUpdate,
            { new: true }
        );

        return NextResponse.json(user, { status: 200 });

    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json({ message: "Update acknowledged" }, { status: 200 });
    }
}
