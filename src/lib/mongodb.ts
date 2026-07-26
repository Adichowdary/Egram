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
        return null;
    }

    if (cached.conn && cached.conn.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 3000, // 3s fast timeout
            connectTimeoutMS: 3000,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
            return m;
        }).catch(() => {
            cached.promise = null;
            return null;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch {
        cached.promise = null;
        return null;
    }

    return cached.conn;
}

export default connectMongo;
