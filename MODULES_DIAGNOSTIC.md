# Modules Not Loading - Diagnostic Checklist

## ✅ Changes Made:

1. **Added prominent error alerts** - Browser will now show popup alerts if:

   - Permission denied error occurs
   - No modules found in database
   - Any exception occurs

2. **Enhanced console logging** - Console now shows:

   ```
   🔄 Starting to fetch modules...
   ✅ Successfully fetched modules: 15
   ✅ Modules data: [...]

   OR

   ❌ ERROR FETCHING MODULES:
      Code: 42501
      Message: permission denied for table modules
      Details: ...
      Hint: ...
   ```

3. **Improved UI feedback** - Yellow warning box when loading:

   - More prominent styling
   - Clear instructions to check console
   - Mentions GRANT permissions

4. **Fixed type mismatch** - Changed `selectedModules` from `string[]` to `number[]`

## 🔍 Next Steps to Diagnose:

### Step 1: Check Browser Console

Open browser console (F12 or Cmd+Option+I) and look for:

**If you see:**

```
❌ ERROR FETCHING MODULES:
   Code: 42501
   Message: permission denied for table modules
```

**Solution:** Run this in Supabase SQL Editor:

```sql
GRANT SELECT ON master_data.modules TO authenticated;
GRANT SELECT ON master_data.modules TO anon;
```

---

**If you see:**

```
⚠️ No modules found matching criteria
```

**Solution:** Check your database:

- Do modules exist in `master_data.modules`?
- Are they marked `is_active = true`?
- Do they have `solution_type` containing 'hms' (case insensitive)?

---

**If you see:**

```
✅ Successfully fetched modules: 0
```

**Solution:** No HMS modules in database. Insert some test data:

```sql
INSERT INTO master_data.modules (
    module_name,
    module_display_name,
    solution_type,
    is_active,
    base_price
) VALUES
    ('OPD', 'Out-Patient Department', 'HMS', true, 1000),
    ('IPD', 'In-Patient Department', 'HMS', true, 1500);
```

---

**If you see:**

```
✅ Successfully fetched modules: 15
✅ Modules data: [{ id: 1, module_name: 'OPD', ... }]
```

**Solution:** Modules loaded successfully! They should appear in the UI.

### Step 2: Check Supabase Logs

1. Go to Supabase Dashboard
2. Click on "Logs" → "Database"
3. Look for queries to `master_data.modules`
4. Check for any errors or permission issues

### Step 3: Verify Database State

Run this SQL in Supabase to verify:

```sql
-- Check if modules table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'master_data'
    AND table_name = 'modules'
);

-- Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'master_data'
AND tablename = 'modules';

-- Check GRANT permissions
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'master_data'
AND table_name = 'modules';

-- Count HMS modules
SELECT COUNT(*)
FROM master_data.modules
WHERE is_active = true
AND solution_type ILIKE '%hms%';

-- See actual modules
SELECT id, module_name, module_display_name, solution_type, is_active, base_price
FROM master_data.modules
WHERE is_active = true
AND solution_type ILIKE '%hms%'
ORDER BY module_display_name;
```

## 📊 Expected Results:

### Table exists:

```
exists
--------
t
```

### RLS enabled:

```
tablename | rowsecurity
----------+-------------
modules   | t
```

### Permissions granted:

```
grantee        | privilege_type
---------------+---------------
authenticated  | SELECT
anon           | SELECT
```

### Modules count:

```
count
-------
15
```

If any of these don't match, that's your issue!

## 🚀 Quick Fix:

If permissions are missing, run this ONE SQL command:

```sql
GRANT SELECT ON master_data.modules TO authenticated, anon;
```

Then refresh your browser.
