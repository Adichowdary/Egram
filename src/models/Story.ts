import mongoose, { Schema, Document } from 'mongoose';

export interface IStory extends Document {
    userId: string;
    userName: string;
    userAvatar?: string;
    mediaUrl: string;
    caption?: string;
    createdAt: Date;
    expiresAt: Date;
}

const StorySchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: "" },
    mediaUrl: { type: String, required: true },
    caption: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire in 24 hrs
        index: { expires: '24h' }
    }
});

export default mongoose.models.Story || mongoose.model<IStory>('Story', StorySchema);
