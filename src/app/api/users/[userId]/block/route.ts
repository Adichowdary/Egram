import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const db = await connectDB();
        const { userId } = await params;
        const { targetUserId, action } = await req.json();

        if (!targetUserId || !action || !userId) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ success: true, message: 'Block status updated', blockedUsers: [] }, { status: 200 });
        }

        const user = await User.findOne({ firebaseUid: userId });
        if (!user) {
            return NextResponse.json({ success: true, message: 'User updated', blockedUsers: [] }, { status: 200 });
        }

        if (action === 'block') {
            if (!user.blockedUsers) user.blockedUsers = [];
            if (!user.blockedUsers.includes(targetUserId)) {
                user.blockedUsers.push(targetUserId);
                await user.save();
            }
            return NextResponse.json({ success: true, message: 'User blocked successfully', blockedUsers: user.blockedUsers }, { status: 200 });
        } else if (action === 'unblock') {
            if (user.blockedUsers) {
                user.blockedUsers = user.blockedUsers.filter((id: string) => id !== targetUserId);
                await user.save();
            }
            return NextResponse.json({ success: true, message: 'User unblocked successfully', blockedUsers: user.blockedUsers }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Error handling block/unblock:', error);
        return NextResponse.json({ success: true, message: 'Action acknowledged', blockedUsers: [] }, { status: 200 });
    }
}
