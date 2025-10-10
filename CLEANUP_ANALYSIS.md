# Database Policies and Functions Cleanup Analysis
**Date: October 10, 2025**
**Cutoff: Remove items created before October 8, 2025**

## Migration Files Timeline

### Before Oct 8 (TO DELETE):
- None found (all migrations are from Oct 8 onwards)

### Oct 8, 2025:
- `20250108_add_user_id_to_profiles.sql`
- `20250108_disable_rls_master_data.sql`
- `20250108_grant_profiles_permissions.sql`
- `20250108_profile_icons_rls.sql`
- `20250108_verify_profiles_permissions.sql`

### Oct 9, 2025:
- `20250109_create_rls_policies.sql`
- `20250109_fix_organization_update_rls.sql`
- `20250109_grant_all_master_data_permissions.sql`
- `20250109_grant_organizations_permissions.sql`
- `20250109_verify_organization_update_rls.sql`

### Oct 10, 2025:
- `20250110_add_entity_logo_and_license_storage.sql`
- `20250110_add_hospitals_rls_policies.sql`
- `20250110_add_missing_organization_fields.sql`
- `20250110_create_generate_entity_platform_id_function.sql`
- `20250110_create_generate_organization_platform_id_function.sql`
- `20250110_create_organization_storage_buckets.sql`
- `20250110_fix_organization_insert_rls.sql`
- `20250110_fix_organizations_rls_policy.sql`

### Oct 11, 2025 (TODAY):
- `20250111_add_modules_rls_policy.sql` ⚠️ SUPERCEDED
- `20250111_add_subscription_columns_to_hospitals.sql`
- `20250111_create_get_hms_modules_function.sql` ⚠️ NOT NEEDED
- `20250111_disable_rls_modules.sql` ✅ UPDATED (now grants permissions)
- `20250111_fix_entity_platform_id_sequential.sql`
- `20250111_fix_organization_platform_id_sequential.sql`
- `20250111_update_entity_platform_id_format.sql`
- `20250111_update_entity_platform_id_no_hyphens.sql`

### Undated:
- `expose_master_data_via_rpc.sql`
- `grant_master_data_access.sql`

---

## RLS Policies Inventory

### Profile Icons (Storage) - ✅ KEEP
- "Anyone can view profile icons"
- "Authenticated users can delete their profile icons"
- "Authenticated users can update their profile icons"
- "Authenticated users can upload profile icons"
- "Public can view profile icons"
- "Users can delete their own profile icon"
- "Users can update their own profile icon"
- "Users can upload their own profile icon"
- "Users can view their own profile icon"

### Organization Logos & Certificates (Storage) - ✅ KEEP
- "Authenticated users can delete organization certificates"
- "Authenticated users can delete organization logos"
- "Authenticated users can update organization certificates"
- "Authenticated users can update organization logos"
- "Authenticated users can upload organization certificates"
- "Authenticated users can upload organization logos"
- "Authenticated users can view organization certificates"
- "Public can view organization logos"

### Organizations Table - ✅ KEEP
- "organizations_delete_policy"
- "organizations_insert_policy"
- "organizations_select_policy"
- "organizations_update_policy"
- "Users can create organizations"
- "Users can delete their own organizations"
- "Users can update their own organizations"
- "Users can view their own organizations"

### Hospitals Table - ✅ KEEP
- "hospitals_delete_policy"
- "hospitals_insert_policy"
- "hospitals_select_policy"
- "hospitals_update_policy"

### Modules Table - ⚠️ REVIEW
- "modules_select_policy" - From 20250111_add_modules_rls_policy.sql
  - **STATUS**: May be working now with GRANT permissions

### Profiles Table - ✅ KEEP
- "Users can insert their own profile"
- "Users can update their own profile"
- "Users can view their own profile"

### Role Assignment Table - ✅ KEEP
- "Platform admins can insert role assignments"
- "Platform admins can update role assignments"
- "Users can view their own role assignments"

### Platform Roles Table - ✅ KEEP
- "Authenticated users can view all roles"

---

## Functions Inventory

### Platform ID Generation - ✅ KEEP
- `master_data.generate_entity_platform_id()` - Used in entity creation
- `master_data.generate_organization_platform_id()` - Used in organization creation

### Role Management Functions - ✅ KEEP
- `public.assign_role_to_user()` - Assigns roles to users
- `public.revoke_role_from_user()` - Removes roles from users
- `public.get_platform_role()` - Gets role details
- `public.list_platform_roles()` - Lists all available roles

### Privilege Check Functions - ✅ KEEP
- `public.get_user_privileges()` - Gets user's full privilege set
- `public.user_has_module()` - Checks if user has module access
- `public.user_has_permission()` - Checks if user has specific permission
- `public.user_has_privilege_level()` - Checks if user has privilege level

### Modules Function - ❌ DELETE (NOT NEEDED)
- `public.get_hms_modules()` - From 20250111_create_get_hms_modules_function.sql
  - **STATUS**: Not needed if we fix GRANT permissions on modules table
  - **REASON**: Direct queries with proper GRANT work better, consistent with other master_data tables

---

## Recommended Actions

### 1. Files to DELETE ❌
None - all files are from Oct 8 onwards (no files before cutoff date)

### 2. Files to CONSOLIDATE/SUPERCEDE ⚠️

#### Modules Access (3 files):
Current situation is messy with 3 different approaches:
- `20250111_add_modules_rls_policy.sql` - Creates RLS policy with USING (true)
- `20250111_create_get_hms_modules_function.sql` - Creates RPC function bypass
- `20250111_disable_rls_modules.sql` - Now grants SELECT permissions

**RECOMMENDATION**: Keep only the GRANT permissions approach:
- ✅ KEEP: `20250111_disable_rls_modules.sql` (updated with GRANT permissions)
- ❌ DELETE: `20250111_add_modules_rls_policy.sql` (superceded by GRANT approach)
- ❌ DELETE: `20250111_create_get_hms_modules_function.sql` (not needed with GRANT)

### 3. Functions to DROP from Database ❌
```sql
-- Drop the RPC function (not needed anymore)
DROP FUNCTION IF EXISTS public.get_hms_modules();
```

### 4. Policies to DROP from Database ❌
```sql
-- Drop the modules RLS policy (using GRANT permissions instead)
DROP POLICY IF EXISTS "modules_select_policy" ON master_data.modules;

-- Ensure RLS can remain enabled with proper GRANT permissions
-- (RLS enabled + GRANT SELECT = works like location_currency)
```

### 5. Keep RLS Status ✅
```sql
-- Keep RLS enabled on modules (consistent with security model)
-- But rely on GRANT permissions for access (like location_currency)
ALTER TABLE master_data.modules ENABLE ROW LEVEL SECURITY;

-- Grant permissions (from updated 20250111_disable_rls_modules.sql)
GRANT SELECT ON master_data.modules TO authenticated;
GRANT SELECT ON master_data.modules TO anon;
GRANT USAGE ON SCHEMA master_data TO authenticated;
GRANT USAGE ON SCHEMA master_data TO anon;
```

---

## Summary

**Total Migrations**: 27 files
**Files to Delete**: 2 (superceded modules-related files)
**Functions to Drop**: 1 (get_hms_modules)
**Policies to Drop**: 1 (modules_select_policy - optional, may keep with GRANT)

**Result**: Clean, consistent approach using GRANT permissions for master_data reference tables, matching the pattern used by location_currency and other reference tables.
