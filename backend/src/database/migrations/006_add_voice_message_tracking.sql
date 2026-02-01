-- Migration: Add voice message tracking to messages table
-- Description: Adds is_voice_message boolean flag to track transcribed audio messages for analytics

ALTER TABLE messages
ADD COLUMN IF NOT EXISTS is_voice_message BOOLEAN DEFAULT FALSE;

-- Add index for analytics queries
CREATE INDEX IF NOT EXISTS idx_messages_is_voice_message 
ON messages(is_voice_message) 
WHERE is_voice_message = true;

COMMENT ON COLUMN messages.is_voice_message IS 'Tracks if message was originally a voice/audio message (transcribed)';
