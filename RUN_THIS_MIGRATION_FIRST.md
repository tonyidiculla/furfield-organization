# 🚨 REQUIRED: Run This Migration in Supabase Dashboard

## The Problem
The form is trying to save these fields that **don't exist in your database yet**:
- ❌ `manager_phone`
- ❌ `business_type`
- ❌ `theme_preference`

## The Solution
Run this SQL in your **Supabase SQL Editor**:

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Copy and Run This SQL

```sql
-- Add missing fields to organizations table
ALTER TABLE master_data.organizations
ADD COLUMN IF NOT EXISTS manager_phone text;

ALTER TABLE master_data.organizations
ADD COLUMN IF NOT EXISTS business_type text;

ALTER TABLE master_data.organizations
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'light';

-- Add comments for documentation
COMMENT ON COLUMN master_data.organizations.manager_phone IS 'Contact phone number for the organization manager';
COMMENT ON COLUMN master_data.organizations.business_type IS 'Type of business entity (e.g., LLC, Corporation, Partnership, LLP, etc.)';
COMMENT ON COLUMN master_data.organizations.theme_preference IS 'UI theme preference: light, dark, or auto';

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'master_data' 
    AND table_name = 'organizations'
    AND column_name IN ('manager_phone', 'business_type', 'theme_preference');
```

### Step 3: Verify Success
After running the SQL, you should see output like:
```
column_name        | data_type | is_nullable | column_default
-------------------+-----------+-------------+----------------
manager_phone      | text      | YES         | null
business_type      | text      | YES         | null
theme_preference   | text      | YES         | 'light'::text
```

### Step 4: Uncomment Fields in Code
After the migration is successful, uncomment these lines in:
**`src/app/organization/[id]/edit/page.tsx`** (around line 178-191):

```typescript
manager_phone: formData.manager_phone || null,
business_type: formData.business_type || null,
theme_preference: formData.theme_preference || 'light',
```

Remove the `// TODO: Add after migration` comments.

## Current Status
✅ Form fields are in the UI
✅ TypeScript types are updated
✅ Form loads and displays correctly
⏳ **WAITING ON YOU**: Run the migration SQL above
❌ Saving will fail for the 3 new fields until migration is complete

## Why Can't I Apply This Automatically?
The psql connection failed with "No route to host", which means I can't directly execute SQL from your local machine. You need to run it through the Supabase dashboard which has proper authentication and network access.
