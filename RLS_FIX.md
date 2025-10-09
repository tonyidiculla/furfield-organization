# Fix RLS Policy Issue for Organizations Table

## Problem
Error: `new row violates row-level security policy for table "organizations"`

This occurs when trying to UPDATE an organization. The RLS policy's `WITH CHECK` clause is preventing the update.

## Root Cause
The RLS policy on the `organizations` table was referencing a non-existent `user_privileges` table. Your application actually uses:
- `profiles` table (links user_id to user_platform_id)
- `user_to_role_assignment` table (assigns roles to users for organizations)
- `platform_roles` table (defines role permissions like entity_configuration, entity_administration)

The RLS policy needs to be updated to use the correct table structure.

## Immediate Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Fix RLS Policy for UPDATE operations on organizations table

-- Drop existing restrictive UPDATE policy
DROP POLICY IF EXISTS "organizations_update_policy" ON master_data.organizations;

-- Create new UPDATE policy
CREATE POLICY "organizations_update_policy" 
ON master_data.organizations
FOR UPDATE
USING (
    -- User must have privileges for this organization
    EXISTS (
        SELECT 1 
        FROM master_data.user_privileges up
        WHERE up.user_id = auth.uid()
        AND up.organization_id = organizations.organization_id
        AND (
            up.access_entity_configuration = true 
            OR up.access_entity_administration = true
        )
        AND up.is_active = true
    )
)
WITH CHECK (
    -- New row must maintain the same organization_id
    -- (prevent changing organization_id to bypass security)
    organization_id IS NOT NULL
);
```

## Verification

After running the fix, verify with:

```sql
-- Check the new policy
SELECT 
    policyname, 
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE schemaname = 'master_data' 
AND tablename = 'organizations'
AND cmd = 'UPDATE';

-- Verify you can update
UPDATE master_data.organizations
SET website = 'https://test-update.com'
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';

-- Roll back the test
UPDATE master_data.organizations
SET website = NULL
WHERE organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
```

## Diagnostic Steps (if issue persists)

1. **Check your privileges:**
   ```sql
   SELECT * FROM master_data.user_privileges 
   WHERE user_id = auth.uid()
   AND organization_id = '639e9d01-756f-4776-80ed-075e5cedefb6';
   ```

2. **Verify entity_configuration access:**
   Make sure `access_entity_configuration` or `access_entity_administration` is TRUE

3. **Check if privilege is active:**
   Make sure `is_active = true` in your user_privileges record

## Alternative: Temporary Bypass (Development Only)

If you need to continue testing immediately, you can temporarily disable RLS on the organizations table:

```sql
-- WARNING: Only for development/testing!
ALTER TABLE master_data.organizations DISABLE ROW LEVEL SECURITY;
```

Remember to re-enable it later:

```sql
ALTER TABLE master_data.organizations ENABLE ROW LEVEL SECURITY;
```

## Long-term Solution

The proper fix is in the migration file: `supabase/migrations/20250110_fix_organizations_rls_policy.sql`

This creates comprehensive policies for SELECT, INSERT, UPDATE, and DELETE operations with proper privilege checks.
