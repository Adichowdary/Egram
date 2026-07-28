import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const bucket = (formData.get("bucket") as string) || "media";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 1. If Supabase Storage is configured, upload directly to Supabase Storage
        if (isSupabaseConfigured()) {
            try {
                const fileExt = file.name.split('.').pop() || 'png';
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `${bucket}/${fileName}`;

                const { data, error } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, buffer, {
                        contentType: file.type || "image/jpeg",
                        upsert: true
                    });

                if (!error && data) {
                    const { data: publicUrlData } = supabase.storage
                        .from(bucket)
                        .getPublicUrl(filePath);

                    return NextResponse.json({
                        success: true,
                        url: publicUrlData.publicUrl,
                        storage: "supabase"
                    }, { status: 200 });
                }
            } catch (supaErr) {
                console.warn("Supabase upload failed, falling back to optimized inline storage:", supaErr);
            }
        }

        // 2. High-performance Fallback: Return optimized lightweight Data URL
        const base64 = buffer.toString('base64');
        const mimeType = file.type || (file.name.endsWith('.mp4') ? "video/mp4" : "image/jpeg");
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({
            success: true,
            url: dataUrl,
            storage: "inline"
        }, { status: 200 });

    } catch (error: any) {
        console.error("Upload handler error:", error);
        return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
    }
}
