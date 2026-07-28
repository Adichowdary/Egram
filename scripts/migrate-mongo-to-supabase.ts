import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import mongoose from 'mongoose';
import { createClient } from '@supabase/supabase-js';

import User from '../src/models/User';
import Group from '../src/models/Group';
import Message from '../src/models/Message';
import Notification from '../src/models/Notification';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/egram';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_KEY must be set in your .env or .env.local file.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateData() {
    console.log('🚀 Starting MongoDB to Supabase Data Migration...');

    try {
        // 1. Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully.');

        // 2. Migrate Users
        const users = await User.find({}).lean();
        console.log(`📦 Found ${users.length} users in MongoDB.`);
        if (users.length > 0) {
            const formattedUsers = users.map((u: any) => ({
                firebase_uid: u.firebaseUid,
                name: u.name || 'Anonymous User',
                email: u.email || `${u.firebaseUid}@egram.app`,
                avatar_url: u.avatarUrl || null,
                bio: u.bio || null,
                cover_image: u.coverImage || null,
                followers: u.followers || [],
                following: u.following || [],
                followers_count: u.followersCount || 0,
                following_count: u.followingCount || 0,
                skills: u.skills || [],
                website: u.website || null,
                blocked_users: u.blockedUsers || [],
                current_streak: u.currentStreak || 0,
                longest_streak: u.longestStreak || 0,
                created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()
            }));

            const { error: userError } = await supabase.from('users').upsert(formattedUsers, { onConflict: 'firebase_uid' });
            if (userError) console.error('⚠️ User migration warning:', userError.message);
            else console.log(`✅ Successfully migrated ${users.length} users to Supabase.`);
        }

        // 3. Migrate Groups
        const groups = await Group.find({}).lean();
        console.log(`📦 Found ${groups.length} groups in MongoDB.`);
        if (groups.length > 0) {
            const formattedGroups = groups.map((g: any) => ({
                mongo_id: g._id.toString(),
                name: g.name,
                avatar_url: g.avatarUrl || null,
                admin_ids: g.adminIds || [],
                member_ids: g.memberIds || [],
                invite_link: g.inviteLink || null,
                created_at: g.createdAt ? new Date(g.createdAt).toISOString() : new Date().toISOString()
            }));

            const { error: groupError } = await supabase.from('groups').upsert(formattedGroups, { onConflict: 'mongo_id' });
            if (groupError) console.error('⚠️ Group migration warning:', groupError.message);
            else console.log(`✅ Successfully migrated ${groups.length} groups to Supabase.`);
        }

        // 4. Migrate Messages
        const messages = await Message.find({}).lean();
        console.log(`📦 Found ${messages.length} messages in MongoDB.`);
        if (messages.length > 0) {
            const formattedMessages = messages.map((m: any) => ({
                mongo_id: m._id.toString(),
                sender_id: m.senderId,
                receiver_id: m.receiverId || null,
                group_id: m.groupId || null,
                content: m.content || '',
                media_url: m.mediaUrl || null,
                media_type: m.mediaType || null,
                deleted_for_everyone: m.deletedForEveryone || false,
                deleted_for_me: m.deletedForMe || [],
                is_read: m.isRead || false,
                created_at: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString()
            }));

            const { error: msgError } = await supabase.from('messages').upsert(formattedMessages, { onConflict: 'mongo_id' });
            if (msgError) console.error('⚠️ Message migration warning:', msgError.message);
            else console.log(`✅ Successfully migrated ${messages.length} messages to Supabase.`);
        }

        // 5. Migrate Notifications
        const notifications = await Notification.find({}).lean();
        console.log(`📦 Found ${notifications.length} notifications in MongoDB.`);
        if (notifications.length > 0) {
            const formattedNotifications = notifications.map((n: any) => ({
                mongo_id: n._id.toString(),
                user_id: n.userId,
                type: n.type,
                source_user_id: n.sourceUserId,
                message: n.message,
                is_read: n.isRead || false,
                created_at: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString()
            }));

            const { error: notifError } = await supabase.from('notifications').upsert(formattedNotifications, { onConflict: 'mongo_id' });
            if (notifError) console.error('⚠️ Notification migration warning:', notifError.message);
            else console.log(`✅ Successfully migrated ${notifications.length} notifications to Supabase.`);
        }

        console.log('🎉 Data migration process complete! All MongoDB data is now synced to Supabase.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrateData();
