# Modules Table RLS Policy Fix

## Problem

The `modules` table has RLS (Row Level Security) enabled but **no policies defined**, causing all SELECT queries to return 0 rows even though the table is populated with data.

## Symptoms

- Console shows: `📊 ALL MODULES IN DATABASE: 0`
- The table actually has data, but RLS blocks access
- Other tables work (location_currency, hospitals) because they have proper RLS policies

## Solution

Run this SQL in **Supabase SQL Editor**:

```sql
-- Create RLS policy to allow authenticated users to read modules
CREATE POLICY "Allow authenticated users to read modules"
ON master_data.modules
FOR SELECT
TO authenticated
USING (true);

-- Grant SELECT permission to authenticated role
GRANT SELECT ON master_data.modules TO authenticated;
```

## How to Apply

1. Go to: https://supabase.com/dashboard/project/xnetjsifkhtbbpadwlxy/sql
2. Paste the SQL above
3. Click "Run" (or press Cmd+Enter)
4. Refresh your browser on the hospital creation form
5. Modules should now load!

## Alternative: Run Migration File

If you prefer using migrations:

```bash
# The migration file is already created:
supabase/migrations/20250111_enable_modules_access.sql

# Apply it via Supabase Dashboard > SQL Editor
# or use Supabase CLI if configured
```

## Verification

After applying the policy, you should see:

```
📊 ALL MODULES IN DATABASE: 15 (or however many modules exist)
Solution types found: ['HMS']
Active modules: 15
```

## Why This Happened

When you run:

```sql
ALTER TABLE master_data.modules ENABLE ROW LEVEL SECURITY;
```

RLS is enabled but with **no policies**, which means:

- ❌ No one can SELECT (even with GRANT SELECT permission)
- ❌ All queries return 0 rows
- ✅ Need to create explicit POLICY to allow access

The GRANT permission alone is not enough when RLS is enabled - you need both:

1. `GRANT SELECT ON table TO role` (permission layer)
2. `CREATE POLICY` (RLS layer)
