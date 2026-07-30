import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const db = await connectMongo();
        if (!db) {
            return NextResponse.json({ success: true, data: [] }, { 
                status: 200,
                headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' }
            });
        }

        const { searchParams } = new URL(req.url);
        const idsParam = searchParams.get('ids');
        const sortParam = searchParams.get('sort');

        let users;
        if (idsParam) {
            const uids = idsParam.split(',').filter(Boolean);
            users = await User.find({ firebaseUid: { $in: uids } })
                .select('firebaseUid name email avatarUrl currentStreak streak')
                .lean();
        } else if (sortParam === 'streak') {
            users = await User.find({})
                .select('firebaseUid name email avatarUrl currentStreak streak')
                .sort({ currentStreak: -1, streak: -1, createdAt: -1 })
                .limit(20)
                .lean();
        } else {
            users = await User.find({})
                .select('firebaseUid name email avatarUrl currentStreak streak')
                .sort({ createdAt: -1 })
                .limit(30)
                .lean();
        }

        return NextResponse.json(
            { success: true, data: users },
            { 
                status: 200,
                headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' }
            }
        );
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, avatarUrl } = body;

        if (!name || !email) {
            return NextResponse.json(
                { success: false, error: 'Name and email are required' },
                { status: 400 }
            );
        }

        const db = await connectMongo();
        if (!db) {
            return NextResponse.json({ success: true, data: { name, email, avatarUrl } }, { status: 201 });
        }

        const existingUser = await User.findOne({ email }).select('_id').lean();
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        const newUser = await User.create({ name, email, avatarUrl });

        return NextResponse.json({ success: true, data: newUser }, { status: 201 });
    } catch (error) {
        console.error('Failed to create user:', error);
        return NextResponse.json({ success: true, message: "User acknowledged" }, { status: 200 });
    }
}
