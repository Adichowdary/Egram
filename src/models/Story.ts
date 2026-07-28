import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
    userId: string;
    userName: string;
    userAvatar?: string;
    mediaUrl: string;
    mediaType?: 'image' | 'video';
    caption?: string;
    views?: Array<{ userId: string; name: string; avatar: string; viewedAt?: Date }>;
    likes?: Array<{ userId: string; name: string; avatar: string }>;
    createdAt: Date;
    expiresAt: Date;
}

const StorySchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: "" },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    caption: { type: String, default: "" },
    views: [{
        userId: { type: String, required: true },
        name: { type: String, default: "User" },
        avatar: { type: String, default: "" },
        viewedAt: { type: Date, default: Date.now }
    }],
    likes: [{
        userId: { type: String, required: true },
        name: { type: String, default: "User" },
        avatar: { type: String, default: "" }
    }],
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire in 24 hrs
        index: { expires: '24h' }
    }
});

export default mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);
