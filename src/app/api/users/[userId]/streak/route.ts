import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const db = await connectMongo();
        const userId = (await params).userId;

        if (!db) {
            return NextResponse.json({ currentStreak: 1, longestStreak: 1, lastLoginDate: new Date() }, { status: 200 });
        }

        let user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            user = await User.create({ firebaseUid: userId, email: `${userId}@egram.student`, name: "Student", currentStreak: 1, longestStreak: 1 });
        }

        const now = new Date();
        const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const today = new Date(todayStr);
        
        let currentStreak = user.currentStreak || 0;
        let longestStreak = user.longestStreak || 0;
        const lastLoginDate = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
        
        let updated = false;

        if (!lastLoginDate) {
            currentStreak = 1;
            longestStreak = 1;
            updated = true;
        } else {
            const lastLoginDayStr = new Date(lastLoginDate.getFullYear(), lastLoginDate.getMonth(), lastLoginDate.getDate()).toISOString();
            const lastLoginDay = new Date(lastLoginDayStr);
            
            const diffTime = Math.abs(today.getTime() - lastLoginDay.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
                currentStreak += 1;
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                }
                updated = true;
            } else if (diffDays > 1) {
                currentStreak = 1;
                updated = true;
            }
        }

        if (updated) {
            user.currentStreak = currentStreak;
            user.longestStreak = longestStreak;
            user.lastLoginDate = now;
            await user.save();
        } else {
            user.lastLoginDate = now;
            await user.save();
        }

        return NextResponse.json({ 
            currentStreak: user.currentStreak, 
            longestStreak: user.longestStreak, 
            lastLoginDate: user.lastLoginDate 
        }, { status: 200 });

    } catch (error: any) {
        console.error("Error updating streak:", error);
        return NextResponse.json({ currentStreak: 1, longestStreak: 1, lastLoginDate: new Date() }, { status: 200 });
    }
}
