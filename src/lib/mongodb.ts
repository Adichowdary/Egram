import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || "";

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
            serverSelectionTimeoutMS: 2000,
            connectTimeoutMS: 2000,
            maxPoolSize: 20,
            minPoolSize: 5,
            maxIdleTimeMS: 30000,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
            return m;
        }).catch((err) => {
            console.error("Mongo Connection Error:", err);
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
