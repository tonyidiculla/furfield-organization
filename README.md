# FURFIELD Organization Management

A Next.js application that integrates with Supabase for authentication and organization management under the FURFIELD brand.

## Prerequisites

- Node.js 18+
- Supabase project with anonymous API key and URL

## Environment variables

Create a `.env.local` file and set the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

These values are required for both sign-in and sign-up to communicate with Supabase.

## Authentication flows

- `GET /auth/sign-in`: Email + password login using Supabase Auth.
- `GET /auth/sign-up`: Email + password registration with confirmation email prompt.

Both pages share a polished UI, handle loading and error states, and use a shared `UserProvider` to keep the current session in sync.

## Development

```bash
npm install
npm run dev
```

Lint the project:

```bash
npm run lint
```

## Global header

Every page renders a glassmorphism-inspired header with the FURFIELD paw logo on the left and the signed-in user on the right. The header pulls user data from `UserContext` so the email/avatar automatically update as the session changes.

> **Trademarked artwork**
>
> The UI expects the FURFIELD paw logo at `public/Furfield-icon.png`. The `FurfieldLogo` component references this exact file, so placing your trademarked artwork here will guarantee the header renders the official asset pixel-for-pixel without modification.

### Custom avatars

- Click your avatar in the header to upload a PNG/JPG/WEBP file (≤5&nbsp;MB) for your profile image.
- Files are stored in the Supabase Storage bucket named `avatars` using the authenticated user's ID as a folder.
- After upload the file URL is saved to `auth.users.user_metadata.avatar_url`; the header will refresh automatically. Ensure the bucket allows public access or configure signed URLs as needed.

### Master data profile icons

Seed gradient-based fallback icons for every record in `master_data.profiles` by uploading generated PNGs to Supabase Storage and writing the public URL into `icon_storage`:

```bash
npm run upload:profile-icons
```

The script requires the following:

- `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` set in your environment (the defaults in `.env` are used automatically).
- Network access to the Supabase Postgres instance. If direct IPv6 connectivity is unavailable, the script falls back to the project's pooler host defined in `supabase/.temp/pooler-url`.

Each icon is generated deterministically from the profile's name/email, producing a unique 256×256 PNG stored in the `profile-icons` bucket. Rows that already contain a populated `icon_storage` object are skipped.

## Privilege and role system

This application integrates with the `master_data.platform_roles` and `master_data.user_to_role_assignment` tables to provide fine-grained role-based access control across the platform.

### Privilege hierarchy

The system defines **13 privilege levels** (lower numbers = higher authority):

1. `platform_admin` - Full platform control
2. `organization_admin` - Manages organizations
3. `entity_admin` - Entity-level administration
4. `provider_admin` - Provider management
5. `clinical_lead` - Clinical oversight
6. `provider` - Healthcare providers
7. `frontdesk_lead` - Front desk supervision
8. `inventory_lead` - Inventory management lead
9. `frontdesk` - Reception staff
10. `inventory` - Inventory staff
11. `scheduler` - Appointment scheduling
12. `billing` - Billing operations
13. `user` - Standard user

### Using privilege gates

The system provides React components for conditional rendering based on user privileges:

#### Require privilege level

```tsx
import { RequirePrivilegeLevel } from '@/components/PrivilegeGates'

<RequirePrivilegeLevel level="organization_admin">
  <AdminPanel />
</RequirePrivilegeLevel>

// With fallback content
<RequirePrivilegeLevel level="clinical_lead" fallback={<p>Access denied</p>}>
  <ClinicalDashboard />
</RequirePrivilegeLevel>
```

#### Require permissions

```tsx
import { RequirePermission, RequireAnyPermission, RequireAllPermissions } from '@/components/PrivilegeGates'

// Single permission
<RequirePermission permission="emr.admin">
  <EMRAdminTools />
</RequirePermission>

// Any of multiple permissions (OR logic)
<RequireAnyPermission permissions={['financial.read', 'financial.admin']}>
  <ViewFinancials />
</RequireAnyPermission>

// All permissions required (AND logic)
<RequireAllPermissions permissions={['scheduling.write', 'inventory.read']}>
  <ComplexWorkflow />
</RequireAllPermissions>
```

#### Require modules

```tsx
import { RequireModule, RequireAnyModule } from '@/components/PrivilegeGates'

// Single module
<RequireModule module="human_resources">
  <HRDashboard />
</RequireModule>

// Any of multiple modules
<RequireAnyModule modules={['emr', 'scheduling']}>
  <ClinicalFeatures />
</RequireAnyModule>
```

### Checking privileges programmatically

Access user privileges through the `UserContext`:

```tsx
"use client";
import { useUser } from "@/contexts/UserContext";
import { hasPrivilegeLevel, hasPermission, hasModule } from "@/lib/privileges";

export default function MyComponent() {
  const { privileges, privilegesLoading } = useUser();

  if (privilegesLoading) return <LoadingSpinner />;
  if (!privileges) return <NoAccessMessage />;

  const canManageOrgs = hasPrivilegeLevel(privileges, "organization_admin");
  const canViewEMR = hasPermission(privileges, "emr.read");
  const hasHRModule = hasModule(privileges, "human_resources");

  return (
    <div>
      {canManageOrgs && <OrganizationTools />}
      {canViewEMR && <PatientRecords />}
      {hasHRModule && <EmployeeManagement />}
    </div>
  );
}
```

### Available utilities

The `src/lib/privileges.ts` module exports:

- `hasPrivilegeLevel(privileges, level)` - Check if user meets minimum privilege level
- `hasPermission(privileges, permission)` - Check single permission
- `hasAnyPermission(privileges, permissions)` - Check if user has ANY of the permissions
- `hasAllPermissions(privileges, permissions)` - Check if user has ALL permissions
- `hasModule(privileges, module)` - Check single module access
- `hasAnyModule(privileges, modules)` - Check if user has ANY of the modules
- `getPrimaryRoleDisplayName(privileges)` - Get display name of highest-ranked role

### Database schema

- **`master_data.platform_roles`**: Defines roles with `role_name`, `privilege_level`, `permissions` (jsonb), and `modules` (text[])
- **`master_data.user_to_role_assignment`**: Links users to roles via `user_id`, `platform_role_id`, `is_active`, and `expires_at`

The `UserContext` automatically fetches and aggregates privileges when a user signs in, combining all active role assignments into a single `UserPrivileges` object with deduplicated permissions and modules.

### RPC Functions

The `master_data` schema is accessed securely through PostgreSQL RPC functions in the `public` schema:

- `get_user_privileges(user_id)` - Fetches all active roles and permissions
- `user_has_privilege_level(user_id, level)` - Checks minimum privilege level
- `user_has_permission(user_id, permission)` - Checks specific permission
- `user_has_module(user_id, module)` - Checks module access
- `assign_role_to_user(user_id, role_id, expires_at)` - Admin function to assign roles
- `revoke_role_from_user(user_id, role_id)` - Admin function to revoke roles

These functions use `SECURITY DEFINER` to provide controlled access without exposing the schema directly. See `supabase/migrations/expose_master_data_via_rpc.sql` for the complete implementation.

To apply the migration, follow instructions in `supabase/APPLY_MIGRATION.md`.

## Project structure

```
src/
  app/
    auth/
      sign-in/
      sign-up/
    organization/
    layout.tsx
  components/
    AppHeader.tsx
    FurfieldLogo.tsx
    PrivilegeGates.tsx
  contexts/
    UserContext.tsx
  lib/
    supabase.ts
    privileges.ts
    fetchUserPrivileges.ts
```

`UserContext` keeps the Supabase session fresh, exposes the current user and their privileges throughout the app, while `AppHeader` and `FurfieldLogo` deliver the standardized FURFIELD branding. `PrivilegeGates` provides conditional rendering components for role-based access control.
