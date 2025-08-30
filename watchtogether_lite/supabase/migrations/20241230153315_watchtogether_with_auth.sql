-- Location: supabase/migrations/20241230153315_watchtogether_with_auth.sql
-- Schema Analysis: Creating new watch-together application with real-time chat
-- Integration Type: Complete new schema with authentication
-- Dependencies: auth.users (Supabase managed)

-- 1. Create custom types
CREATE TYPE public.user_role AS ENUM ('admin', 'moderator', 'member');
CREATE TYPE public.message_type AS ENUM ('user', 'system', 'notification');
CREATE TYPE public.room_status AS ENUM ('active', 'paused', 'ended');

-- 2. Core user profiles table (intermediary for PostgREST compatibility)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role public.user_role DEFAULT 'member'::public.user_role,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Watch rooms table
CREATE TABLE public.watch_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT 'Main Room',
    description TEXT,
    created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    current_video_url TEXT,
    current_video_time INTEGER DEFAULT 0,
    is_playing BOOLEAN DEFAULT false,
    room_status public.room_status DEFAULT 'active'::public.room_status,
    max_users INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Chat messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.watch_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type public.message_type DEFAULT 'user'::public.message_type,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Room participants table (for presence tracking)
CREATE TABLE public.room_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.watch_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT true,
    UNIQUE(room_id, user_id)
);

-- 6. Essential Indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_room_participants_room_id ON public.room_participants(room_id);
CREATE INDEX idx_room_participants_user_id ON public.room_participants(user_id);
CREATE INDEX idx_watch_rooms_created_by ON public.watch_rooms(created_by);

-- 7. Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

-- 8. Functions for automatic profile creation and room management
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 9. Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_last_seen();

CREATE TRIGGER update_watch_rooms_updated_at
  BEFORE UPDATE ON public.watch_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_last_seen();

-- 10. RLS Policies using the 7-Pattern System

-- Pattern 1: Core user table - Simple ownership, no functions
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Pattern 2: Simple user ownership for rooms
CREATE POLICY "users_manage_own_rooms"
ON public.watch_rooms
FOR ALL
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Pattern 4: Public read, private write for chat messages (anyone can read room messages)
CREATE POLICY "public_can_read_messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "users_can_create_messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Pattern 2: Simple ownership for room participants
CREATE POLICY "users_manage_own_participation"
ON public.room_participants
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 11. Create default room and mock data
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    user1_uuid UUID := gen_random_uuid();
    user2_uuid UUID := gen_random_uuid();
    main_room_id UUID := gen_random_uuid();
BEGIN
    -- Create complete auth users with required fields
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@watchtogether.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"display_name": "Admin User"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'sarah@example.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"display_name": "Sarah Chen"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'mike@example.com', crypt('password123', gen_salt('bf', 10)), now(), now(), now(),
         '{"display_name": "Mike Johnson"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb,
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null);

    -- Create main watch room
    INSERT INTO public.watch_rooms (id, name, description, created_by) VALUES
        (main_room_id, 'Main Watch Room', 'The default room for watching videos together', admin_uuid);

    -- Add some sample chat messages
    INSERT INTO public.chat_messages (room_id, user_id, user_name, content, message_type) VALUES
        (main_room_id, user1_uuid, 'Sarah Chen', 'Hey everyone! Ready to watch together?', 'user'),
        (main_room_id, user2_uuid, 'Mike Johnson', 'Yes! This is so cool. Live synchronized viewing!', 'user'),
        (main_room_id, admin_uuid, 'Admin User', 'Welcome to WatchTogether! Enjoy your synchronized viewing experience.', 'user');

    -- Add participants to the room
    INSERT INTO public.room_participants (room_id, user_id) VALUES
        (main_room_id, admin_uuid),
        (main_room_id, user1_uuid),
        (main_room_id, user2_uuid);

    -- Update the room ID in a separate statement to ensure the room exists first
    UPDATE public.watch_rooms 
    SET id = 'main-room'::UUID 
    WHERE id = main_room_id;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE NOTICE 'Foreign key error: %', SQLERRM;
    WHEN unique_violation THEN
        RAISE NOTICE 'Unique constraint error: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE NOTICE 'Unexpected error: %', SQLERRM;
END $$;

-- 12. Create cleanup function for development
CREATE OR REPLACE FUNCTION public.cleanup_test_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    test_user_ids UUID[];
BEGIN
    -- Get test user IDs
    SELECT ARRAY_AGG(id) INTO test_user_ids
    FROM auth.users
    WHERE email IN ('admin@watchtogether.com', 'sarah@example.com', 'mike@example.com');

    -- Delete in dependency order
    DELETE FROM public.room_participants WHERE user_id = ANY(test_user_ids);
    DELETE FROM public.chat_messages WHERE user_id = ANY(test_user_ids);
    DELETE FROM public.watch_rooms WHERE created_by = ANY(test_user_ids);
    DELETE FROM public.user_profiles WHERE id = ANY(test_user_ids);
    DELETE FROM auth.users WHERE id = ANY(test_user_ids);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Cleanup failed: %', SQLERRM;
END;
$$;