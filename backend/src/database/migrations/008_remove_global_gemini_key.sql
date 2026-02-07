-- Migration to remove the global gemini_api_key column from system_settings
-- This enforces the use of user-specific API keys from the profiles table.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'system_settings' AND column_name = 'gemini_api_key') THEN
        ALTER TABLE system_settings DROP COLUMN gemini_api_key;
    END IF;
END $$;
