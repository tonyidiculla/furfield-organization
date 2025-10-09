-- Verify that the organization UPDATE RLS policy is working
-- Run this in Supabase SQL Editor to test

-- First, check if RLS is enabled on organizations table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations';

-- Check the UPDATE policy exists
SELECT * 
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations' 
AND cmd = 'UPDATE';

-- Test the UPDATE operation (this should be run while authenticated as a user)
-- This will show if the policy allows the update
-- Replace 'a0c7b13a-1a45-496d-a8db-83d2847ac981' with your organization_id

-- To test, you can try:
-- UPDATE master_data.organizations 
-- SET is_active = 'inactive' 
-- WHERE organization_id = 'a0c7b13a-1a45-496d-a8db-83d2847ac981';

-- Check current organization status
SELECT 
    organization_id,
    organization_name,
    owner_platform_id,
    is_active,
    updated_at
FROM master_data.organizations
WHERE owner_platform_id = 'H00000001';
