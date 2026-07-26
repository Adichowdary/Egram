import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/models/User";
import Follower from "@/models/Follower";

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId: targetUserId } = await params;
        const { searchParams } = new URL(req.url);
        const currentUserId = searchParams.get("currentUserId");

        if (!targetUserId) {
            return NextResponse.json({ targetUserId: "", followers: [] }, { status: 200 });
        }

        const db = await connectMongo();
        if (!db) {
            return NextResponse.json({ targetUserId, followers: [] }, { status: 200 });
        }

        // 1. Fetch all follower records where targetUserId is being followed
        const followRecords = await Follower.find({ followingId: targetUserId }).lean();
        const followerUids = followRecords.map(r => r.followerId);

        if (followerUids.length === 0) {
            return NextResponse.json({ targetUserId, followers: [] }, { status: 200 });
        }

        // 2. Fetch full user profiles for all followers
        const users = await User.find({ firebaseUid: { $in: followerUids } }).lean();

        // 3. If currentUserId is provided, check which of these users currentUserId is following
        let currentUserFollowingSet = new Set<string>();
        if (currentUserId) {
            const currentUserFollows = await Follower.find({
                followerId: currentUserId,
                followingId: { $in: followerUids }
            }).lean();
            currentUserFollows.forEach(f => currentUserFollowingSet.add(f.followingId));
        }

        // 4. Map users into standard profile response objects
        const followers = users.map(u => ({
            uid: u.firebaseUid,
            displayName: u.name || "Student",
            photoURL: u.avatarUrl || "",
            bio: u.bio || "",
            followersCount: u.followersCount || 0,
            followingCount: u.followingCount || 0,
            streak: u.currentStreak || 0,
            isFollowing: currentUserFollowingSet.has(u.firebaseUid)
        }));

        return NextResponse.json({ targetUserId, followers }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/users/[userId]/followers:", error);
        return NextResponse.json({ targetUserId: "", followers: [] }, { status: 200 });
    }
}
