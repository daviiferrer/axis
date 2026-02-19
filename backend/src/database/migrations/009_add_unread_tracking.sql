-- Migration: 009_add_unread_tracking
-- Description: Adds last_read_at column to chats for unread message counting
-- Date: 2026-02-17

-- =====================================================
-- STEP 1: Add last_read_at to chats table
-- =====================================================
-- This column tracks when the user last viewed a conversation.
-- Messages with created_at > last_read_at and from_me = false are "unread".

ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS last_read_at 
    TIMESTAMP WITH TIME ZONE DEFAULT '1970-01-01T00:00:00Z';

-- =====================================================
-- STEP 2: Create index for efficient unread count queries
-- =====================================================
-- This composite index allows fast counting of unread messages per chat.

CREATE INDEX IF NOT EXISTS idx_messages_chat_created_fromme
    ON messages(chat_id, created_at DESC, from_me);

-- =====================================================
-- Done!
-- =====================================================
