import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const db = await connectMongo();
        if (!db) {
            return NextResponse.json([], { status: 200 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || !query.trim()) {
            return NextResponse.json([], { status: 200 });
        }

        const trimmedQuery = query.trim();

        // Safely escape special characters for regex searching
        const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = new RegExp(escapedQuery, "i");

        const filter: any = {
            $or: [
                { name: { $regex: searchRegex } },
                { email: { $regex: searchRegex } }
            ]
        };

        const users = await User.find(filter)
            .select("firebaseUid name email avatarUrl bio followersCount followingCount currentStreak")
            .limit(25)
            .lean();

        return NextResponse.json(users, { status: 200 });

    } catch (error: any) {
        console.error("Error searching users:", error);
        return NextResponse.json([], { status: 200 });
    }
}
