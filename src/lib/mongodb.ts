import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "";

/**
 * Global cache to maintain connection across Vercel serverless function invocations
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectMongo() {
    if (!MONGODB_URI) {
        console.warn("MONGODB_URI environment variable is missing on Vercel Dashboard. Please add MONGODB_URI to Vercel Project Settings > Environment Variables.");
        return null;
    }

    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000, // 5s timeout to prevent Vercel 10s execution timeouts
            connectTimeoutMS: 5000,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
            return m;
        }).catch(err => {
            console.error("MongoDB Connection Error on Vercel:", err.message);
            cached.promise = null;
            return null;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("MongoDB Connection Exception:", e);
        return null;
    }

    return cached.conn;
}

export default connectMongo;
