-- Add user_id column to master_data.profiles to link with auth.users
ALTER TABLE master_data.profiles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON master_data.profiles(user_id);

-- Add a unique constraint to ensure one profile per auth user
ALTER TABLE master_data.profiles
ADD CONSTRAINT unique_user_id UNIQUE (user_id);

-- Optional: Add a comment to document the relationship
COMMENT ON COLUMN master_data.profiles.user_id IS 'Foreign key to auth.users.id - links platform profile to authentication user';
