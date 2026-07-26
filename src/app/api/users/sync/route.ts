import { NextResponse } from "next/server";
import connectMongo from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        await connectMongo();
        const { uid, email, displayName, photoURL } = await req.json();

        if (!uid || !email) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check if user exists, if not create one
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
            // Preserve existing name in MongoDB if set. Only initialize if name is missing.
            if (!user.name || user.name.trim() === "") {
                user.name = (displayName && !displayName.includes('@')) ? displayName : email.split("@")[0];
            }

            if (photoURL && !user.avatarUrl) {
                user.avatarUrl = photoURL;
            }
            await user.save();
        }

        return NextResponse.json({ message: "User synced", user }, { status: 200 });

    } catch (error: any) {
        console.error("Error syncing user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
