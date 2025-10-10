# Organization Platform ID Auto-Generation

## Overview

Implemented automatic generation of `organization_platform_id` in the create organization form, following the platform_id_mapping system logic.

## Changes Made

### 1. Database Function

**File:** `supabase/migrations/20250110_create_generate_organization_platform_id_function.sql`

Created PostgreSQL function `master_data.generate_organization_platform_id()`:

- Generates sequential platform IDs in format: `[CategoryCode][TypeCode][SequentialNumber]`
- Supports Company (C00) and Entity (E01-E05) types
- Auto-increments the sequential number based on existing IDs
- Returns formatted IDs (e.g., `C00000001`, `E01000001`)
- Includes validation and race condition handling
- Granted execute permission to authenticated users

### 2. Create Form Updates

**File:** `src/app/organization/create/page.tsx`

#### Removed Manual Input

- Removed the `organization_platform_id` input field from the form
- Added informative text: "Organization Platform ID will be automatically generated when you create the organization."

#### Auto-Generation Logic

- Modified `handleSubmit` to call `generate_organization_platform_id()` RPC function
- Defaults to Company type (C00) - can be made selectable in the future
- Falls back to form value if manually provided (for edge cases/admin use)

#### Validation Updates

- Removed validation for `organization_platform_id` since it's auto-generated
- Kept validation for `owner_platform_id` and `manager_platform_id` (must be Human type)

### 3. User Experience

- **Before:** Users had to manually enter a valid organization platform ID
- **After:** Platform ID is automatically generated behind the scenes
- Cleaner form with one less required field
- No risk of duplicate or invalid organization IDs

## Platform ID Format

```
Format: [Category][Type][Sequential]
Examples:
- C00000001 (Company - Default)
- E01000001 (Entity - Hospital)
- E02000001 (Entity - eStore)
- E03000001 (Entity - Retail Store)
- E04000001 (Entity - Channel Partner)
- E05000001 (Entity - Platform Support)
```

## Database Requirements

**IMPORTANT:** Run the migration SQL file to create the function:

```sql
-- Run in Supabase SQL Editor
-- File: supabase/migrations/20250110_create_generate_organization_platform_id_function.sql
```

Or manually execute the function creation SQL in your Supabase dashboard.

## Future Enhancements

1. **Selectable Organization Type:**

   - Add UI to let users choose between Company (C) or Entity (E) types
   - For Entity, allow selection of subtype (Hospital, eStore, etc.)

2. **Display Generated ID:**

   - Show the generated ID to the user after successful creation
   - Add it to the success message or redirect to edit page

3. **Admin Override:**
   - Keep hidden input for admins to manually specify IDs if needed
   - Useful for data migration or special cases

## Benefits

✅ **Consistency:** All organization IDs follow the same format automatically
✅ **Data Integrity:** No duplicate or malformed IDs
✅ **User Experience:** Simpler form, less room for error
✅ **Security:** Platform IDs are immutable and system-controlled
✅ **Scalability:** Sequential numbering ensures uniqueness

## Testing

1. Create a new organization without entering a platform ID
2. Check the database - should see auto-generated ID (C00000001, C00000002, etc.)
3. Verify the ID follows the correct format
4. Confirm no validation errors during creation

## Notes

- The function is `SECURITY DEFINER` to ensure it runs with elevated privileges
- Race condition handling prevents duplicate IDs in concurrent requests
- The sequential number is zero-padded to 8 digits minimum
- Platform IDs remain immutable after creation (enforced in edit form)
