-- Supabase Schema for Egram Application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    cover_image TEXT,
    followers TEXT[] DEFAULT '{}',
    following TEXT[] DEFAULT '{}',
    followers_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    skills TEXT[] DEFAULT '{}',
    website TEXT,
    blocked_users TEXT[] DEFAULT '{}',
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching users by name or email
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON public.users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);

-- 2. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    admin_ids TEXT[] DEFAULT '{}',
    member_ids TEXT[] DEFAULT '{}',
    invite_link TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_member_ids ON public.groups USING GIN(member_ids);

-- 3. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    sender_id TEXT NOT NULL,
    receiver_id TEXT,
    group_id TEXT,
    content TEXT DEFAULT '',
    media_url TEXT,
    media_type TEXT,
    deleted_for_everyone BOOLEAN DEFAULT FALSE,
    deleted_for_me TEXT[] DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ultra-fast chat query lookups
CREATE INDEX IF NOT EXISTS idx_messages_direct ON public.messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_group ON public.messages(group_id, created_at);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mongo_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    source_user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- Enable Supabase Realtime publication on messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
