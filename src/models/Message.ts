import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
    senderId: string;
    receiverId?: string; // Optional if groupId is set
    groupId?: string; // Optional if receiverId is set
    content: string;
    mediaUrl?: string;
    mediaType?: string; // 'image' or 'pdf'
    deletedForEveryone: boolean;
    deletedForMe: string[]; // Array of user IDs
    isRead: boolean;
    createdAt: Date;
}

const MessageSchema: Schema = new Schema({
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, index: true },
    groupId: { type: String, index: true },
    content: { type: String, default: "" },
    mediaUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'pdf'] },
    deletedForEveryone: { type: Boolean, default: false },
    deletedForMe: [{ type: String }],
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // TTL index: 24 hours (86400 seconds)
});

MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
MessageSchema.index({ groupId: 1, createdAt: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
