# Why Modules Are Not Loading - Diagnosis

## ❌ Problem: Permission Denied (Error 42501)

The modules are not loading because the `master_data.modules` table lacks SELECT permissions.

### Root Cause:

```
master_data.modules table:
✅ RLS Enabled: Yes
❌ GRANT SELECT: No (not run yet)
```

Compare with working table:

```
master_data.location_currency table:
✅ RLS Enabled: Yes
✅ GRANT SELECT: Yes (from 20250109_grant_all_master_data_permissions.sql)
→ This is why location_currency works!
```

## ✅ Solution: Run GRANT Permissions

You need to execute this SQL in your **Supabase SQL Editor**:

```sql
-- Grant SELECT permission on modules table
GRANT SELECT ON master_data.modules TO authenticated;
GRANT SELECT ON master_data.modules TO anon;
GRANT USAGE ON SCHEMA master_data TO authenticated;
GRANT USAGE ON SCHEMA master_data TO anon;
```

## Steps to Fix:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the SQL from `supabase/cleanup_modules_access.sql`
4. Click "Run"
5. Refresh your browser on the hospital creation form
6. Modules should now load! ✅

## Files Ready to Execute:

Choose one of these files to run:

- ✅ `supabase/cleanup_modules_access.sql` (includes cleanup + grants)
- ✅ `supabase/migrations/20250111_disable_rls_modules.sql` (grants only)

Both will fix the issue.

## Why This Happens:

Your code is correct:

```typescript
const { data, error } = await supabase
  .schema("master_data")
  .from("modules")
  .select("...")
  .ilike("solution_type", "%hms%")
  .eq("is_active", true);
```

But the database returns:

```
Error Code: 42501
Message: permission denied for table modules
```

Because authenticated users don't have SELECT permission on the table.

## After Running SQL:

You should see in console:

```
✅ Fetched modules count: 15
✅ Fetched modules: [{ id: 1, module_name: 'OPD', ... }, ...]
```

## Pattern:

All `master_data` reference tables should have:

1. ✅ RLS enabled
2. ✅ GRANT SELECT to authenticated and anon
3. ✅ Direct queries using `.schema('master_data').from(table)`

This is the pattern that works for `location_currency`, and will work for `modules` once you run the GRANT SQL.
