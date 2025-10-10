# RPC Functions for Privilege System

## Overview

This implementation provides secure access to the `master_data` schema through PostgreSQL RPC (Remote Procedure Call) functions. The `master_data` schema is **not exposed** directly through PostgREST/Supabase API, ensuring better security and controlled access.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js Application (Client)                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React Components                                    │   │
│  │  - PrivilegeGates                                   │   │
│  │  - RequirePrivilegeLevel                            │   │
│  │  - RequirePermission                                │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │  UserContext                                         │   │
│  │  - Manages auth state                               │   │
│  │  - Fetches & caches privileges                      │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │  fetchUserPrivileges() / privilegeRpc.ts            │   │
│  │  - Calls Supabase RPC functions                     │   │
│  └──────────────────────┬──────────────────────────────┘   │
└────────────────────────┼───────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase / PostgREST                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  public schema (EXPOSED via API)                    │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │  RPC Functions (SECURITY DEFINER)           │   │   │
│  │  │  - get_user_privileges(user_id)             │   │   │
│  │  │  - user_has_privilege_level(user_id, level) │   │   │
│  │  │  - user_has_permission(user_id, perm)       │   │   │
│  │  │  - assign_role_to_user(...)                 │   │   │
│  │  └─────────────────┬───────────────────────────┘   │   │
│  └────────────────────┼───────────────────────────────┘   │
│                       │                                     │
│  ┌────────────────────▼───────────────────────────────┐   │
│  │  master_data schema (PRIVATE - not exposed)        │   │
│  │  - platform_roles                                  │   │
│  │  - user_to_role_assignment                         │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Benefits of RPC Approach

1. **Security**: `master_data` schema remains private and not exposed through API
2. **Control**: Functions define exact queries users can execute
3. **Performance**: Can optimize queries within functions
4. **Flexibility**: Easy to add business logic and validation
5. **Audit**: All access goes through defined functions

## Available RPC Functions

### Read Functions (All authenticated users)

#### `get_user_privileges(user_id UUID)`

Returns all active role assignments with role details for a user.

```typescript
import { supabase } from "@/lib/supabase";

const { data, error } = await supabase.rpc("get_user_privileges", {
  user_id_param: userId,
});
```

#### `user_has_privilege_level(user_id UUID, required_level INTEGER)`

Checks if user meets minimum privilege level (lower number = higher privilege).

```typescript
const { data } = await supabase.rpc("user_has_privilege_level", {
  user_id_param: userId,
  required_level: 2, // organization_admin
});
// Returns: boolean
```

#### `user_has_permission(user_id UUID, permission_key TEXT)`

Checks if user has a specific permission.

```typescript
const { data } = await supabase.rpc("user_has_permission", {
  user_id_param: userId,
  permission_key: "emr.admin",
});
// Returns: boolean
```

#### `user_has_module(user_id UUID, module_name TEXT)`

Checks if user has access to a module.

```typescript
const { data } = await supabase.rpc("user_has_module", {
  user_id_param: userId,
  module_name: "human_resources",
});
// Returns: boolean
```

### Admin Functions (Privilege level ≤ 2 only)

#### `assign_role_to_user(target_user_id UUID, role_id UUID, expires_at TIMESTAMPTZ)`

Assigns a role to a user. Only platform_admin (1) and organization_admin (2) can call this.

```typescript
const { data } = await supabase.rpc("assign_role_to_user", {
  target_user_id: userId,
  role_id: roleId,
  expires_at_param: null, // or '2025-12-31'
});
// Returns: assignment UUID
```

#### `revoke_role_from_user(target_user_id UUID, role_id UUID)`

Revokes a role from a user.

```typescript
const { data } = await supabase.rpc("revoke_role_from_user", {
  target_user_id: userId,
  role_id: roleId,
});
// Returns: boolean
```

## Helper Library

Use `src/lib/privilegeRpc.ts` for typed TypeScript wrappers:

```typescript
import {
  checkUserPrivilegeLevel,
  checkUserPermission,
  checkUserModule,
  assignRoleToUser,
  revokeRoleFromUser,
} from "@/lib/privilegeRpc";

// Check privilege
const isAdmin = await checkUserPrivilegeLevel(userId, 2);

// Check permission
const canEditEMR = await checkUserPermission(userId, "emr.admin");

// Check module
const hasHR = await checkUserModule(userId, "human_resources");

// Assign role (admin only)
const assignmentId = await assignRoleToUser(userId, roleId);
```

## Security Features

1. **SECURITY DEFINER**: Functions run with database owner privileges, not caller's
2. **Explicit Grants**: Only `authenticated` role can execute functions
3. **Input Validation**: Functions validate all inputs
4. **Admin Checks**: Assign/revoke functions verify caller has privilege level ≤ 2
5. **Active Checks**: All queries filter by `is_active = true` and check expiration
6. **No Direct Schema Access**: Client cannot query master_data directly

## Performance Optimizations

The migration includes indexes:

- `idx_user_role_assignment_user_active` - Fast user lookup
- `idx_user_role_assignment_expires` - Expiration checks
- `idx_platform_roles_active` - Active roles filtering

## Migration Application

See `supabase/APPLY_MIGRATION.md` for instructions on applying the RPC functions to your database.

## Files Created

- `supabase/migrations/expose_master_data_via_rpc.sql` - Complete migration
- `src/lib/privilegeRpc.ts` - TypeScript helper functions
- `src/lib/fetchUserPrivileges.ts` - Updated to use RPC
- `supabase/APPLY_MIGRATION.md` - Migration instructions
- `scripts/test-schema-access.ts` - Schema access tester

## Next Steps

1. Apply the migration using Supabase SQL Editor
2. Assign yourself a role in `master_data.user_to_role_assignment`
3. Sign in to the app
4. Visit `/organization` to see your privileges
