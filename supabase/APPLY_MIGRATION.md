# Applying RPC Functions Migration

Since the direct PostgreSQL connection has IPv6 routing issues, you can apply the migration through the Supabase Dashboard:

## Option 1: Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xnetjsifkhtbbpadwlxy
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/expose_master_data_via_rpc.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

## Option 2: Use Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project (if not already linked)
supabase link --project-ref xnetjsifkhtbbpadwlxy

# Apply the migration
supabase db push

# Or apply the specific file
supabase db push supabase/migrations/expose_master_data_via_rpc.sql
```

## Option 3: Manual Copy-Paste

The migration file is located at:

```
/Users/tonyidiculla/Developer/organization/supabase/migrations/expose_master_data_via_rpc.sql
```

You can open it, copy all the contents, and run it in the Supabase SQL Editor.

## What This Migration Does

Creates 8 RPC functions in the `public` schema:

1. **get_user_privileges(user_id)** - Fetches all active roles and permissions for a user
2. **get_platform_role(role_id)** - Gets details of a specific role
3. **list_platform_roles()** - Lists all available roles
4. **user_has_privilege_level(user_id, level)** - Checks if user has minimum privilege level
5. **user_has_permission(user_id, permission)** - Checks specific permission
6. **user_has_module(user_id, module)** - Checks module access
7. **assign_role_to_user(user_id, role_id, expires_at)** - Assigns role (admin only)
8. **revoke_role_from_user(user_id, role_id)** - Revokes role (admin only)

## After Migration

1. The app will automatically use these RPC functions through `fetchUserPrivileges()`
2. You can call them directly using the `privilegeRpc.ts` helper functions
3. The `master_data` schema remains private and secure

## Verify Migration

Run this query in SQL Editor to verify:

```sql
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (routine_name LIKE '%privilege%'
         OR routine_name LIKE '%role%')
ORDER BY routine_name;
```

You should see all 8 functions listed.
