import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-egram.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
    },
});

export const isSupabaseConfigured = () => {
    return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder-egram.supabase.co"
    );
};

export interface SupabaseMessage {
    id: string;
    mongo_id?: string;
    sender_id: string;
    receiver_id?: string | null;
    group_id?: string | null;
    content: string;
    media_url?: string | null;
    media_type?: string | null;
    deleted_for_everyone?: boolean;
    deleted_for_me?: string[];
    is_read?: boolean;
    created_at: string;
}

// Fetch messages between two users or within a group
export const fetchSupabaseMessages = async (params: { user1?: string; user2?: string; groupId?: string }) => {
    if (!isSupabaseConfigured()) return [];
    
    let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
    
    if (params.groupId) {
        query = query.eq('group_id', params.groupId);
    } else if (params.user1 && params.user2) {
        query = query.or(`and(sender_id.eq.${params.user1},receiver_id.eq.${params.user2}),and(sender_id.eq.${params.user2},receiver_id.eq.${params.user1})`);
    } else {
        return [];
    }
    
    const { data, error } = await query;
    if (error) {
        console.error("Error fetching messages from Supabase:", error);
        return [];
    }
    return data as SupabaseMessage[];
};

// Send a new message to Supabase
export const sendSupabaseMessage = async (msg: {
    senderId: string;
    receiverId?: string;
    groupId?: string;
    content: string;
    mediaUrl?: string;
    mediaType?: string;
}) => {
    if (!isSupabaseConfigured()) return null;

    const row = {
        sender_id: msg.senderId,
        receiver_id: msg.receiverId || null,
        group_id: msg.groupId || null,
        content: msg.content || '',
        media_url: msg.mediaUrl || null,
        media_type: msg.mediaType || null,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('messages').insert([row]).select().single();
    if (error) {
        console.error("Error inserting message to Supabase:", error);
        return null;
    }
    return data as SupabaseMessage;
};

// Subscribe to Real-time messages for direct chat or group
export const subscribeToChatMessages = (
    params: { user1?: string; user2?: string; groupId?: string },
    onNewMessage: (msg: SupabaseMessage) => void
) => {
    if (!isSupabaseConfigured()) return () => {};

    const channelName = params.groupId 
        ? `group_chat_${params.groupId}` 
        : `direct_chat_${[params.user1, params.user2].sort().join('_')}`;

    const channel = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            },
            (payload) => {
                const newMsg = payload.new as SupabaseMessage;
                if (params.groupId && newMsg.group_id === params.groupId) {
                    onNewMessage(newMsg);
                } else if (
                    params.user1 && params.user2 &&
                    ((newMsg.sender_id === params.user1 && newMsg.receiver_id === params.user2) ||
                     (newMsg.sender_id === params.user2 && newMsg.receiver_id === params.user1))
                ) {
                    onNewMessage(newMsg);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

