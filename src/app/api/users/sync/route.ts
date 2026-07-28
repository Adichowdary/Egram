import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const db = await connectMongo();
        const { uid, email, displayName, photoURL } = await req.json();

        if (!uid || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!db) {
            return NextResponse.json({ message: "User synced locally", user: { firebaseUid: uid, email, name: displayName } }, { status: 200 });
        }

        let user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            const initialName = (displayName && !displayName.includes('@')) ? displayName : email.split("@")[0];
            user = await User.create({
                firebaseUid: uid,
                email,
                name: initialName,
                avatarUrl: photoURL || "",
            });
            return NextResponse.json({ message: "User created", user }, { status: 201 });
        } else {
            let modified = false;
            if (displayName && displayName.trim() !== "" && !displayName.includes('@') && user.name !== displayName) {
                user.name = displayName.trim();
                modified = true;
            }
            if (photoURL && photoURL.trim() !== "" && (!user.avatarUrl || (user.avatarUrl !== photoURL && !user.avatarUrl.startsWith('data:')))) {
                user.avatarUrl = photoURL.trim();
                modified = true;
            }
            if (modified) {
                await user.save();
            }
        }

        return NextResponse.json({ message: "User synced", user }, { status: 200 });

    } catch (error: any) {
        console.error("Error syncing user:", error);
        return NextResponse.json({ message: "User sync acknowledged" }, { status: 200 });
    }
}
