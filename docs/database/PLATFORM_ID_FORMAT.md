# Platform ID Generation Format

## ✅ CORRECT FORMAT

All platform IDs in the system follow this pattern:

- **Fixed 3-character prefix** (identifies entity type)
- **6 random alphanumeric characters** (A-Z, a-z, 0-9)

### Entity Types:

| Entity              | Prefix | Format                 | Example     |
| ------------------- | ------ | ---------------------- | ----------- |
| **Organization**    | `C00`  | `C00` + 6 random chars | `C00a7Yk2p` |
| **Hospital Entity** | `E01`  | `E01` + 6 random chars | `E01x3Bm9k` |

## Implementation

### Database Functions (RPC)

Both functions use the same logic:

1. Generate 6 random alphanumeric characters
2. Prepend the fixed prefix (C00 or E01)
3. Check uniqueness in the respective table
4. If collision, retry (max 100 attempts)
5. Return unique ID

### Why RPC Functions?

**You MUST use RPC for platform ID generation** because:

1. ✅ **Atomic Operation**: Database generates + checks uniqueness in one transaction
2. ✅ **Race Condition Prevention**: Two users can't get the same random ID
3. ✅ **Server-Side Random**: More secure than client-side generation
4. ✅ **Retry Logic**: Automatically handles collisions
5. ✅ **Performance**: Single database call vs multiple queries

**Cannot be done with direct queries** because:

- ❌ Client-side random generation has race conditions
- ❌ Would need multiple queries (generate → check → retry)
- ❌ Not atomic - another user could insert between check and create

### Usage in Code

```typescript
// Organization Platform ID
const { data: orgId } = await supabase
  .schema("master_data")
  .rpc("generate_organization_platform_id");
// Returns: C00a7Yk2p

// Hospital Entity Platform ID
const { data: entityId } = await supabase
  .schema("master_data")
  .rpc("generate_entity_platform_id");
// Returns: E01x3Bm9k
```

## Migration Files

✅ **ACTIVE:**

- `20250110_create_generate_organization_platform_id_function.sql` - C00 format
- `20250110_create_generate_entity_platform_id_function.sql` - E01 format

❌ **DELETED** (were incorrect sequential format):

- `20250111_fix_organization_platform_id_sequential.sql`
- `20250111_fix_entity_platform_id_sequential.sql`

## Characteristics

- **Length**: Always 9 characters (3 prefix + 6 random)
- **Character Set**: A-Z, a-z, 0-9 (62 possible characters per position)
- **Uniqueness**: Guaranteed by database function
- **Collision Space**: 62^6 = 56,800,235,584 possible IDs per entity type
- **Collision Probability**: Virtually zero for normal usage

## Future Entity Types

When adding new entity types, follow the same pattern:

- Choose a unique 3-character prefix (e.g., `P02` for Pharmacies)
- Generate 6 random alphanumeric characters
- Create similar RPC function
- Check uniqueness in the relevant table

Example for future Pharmacy entities:

```sql
CREATE OR REPLACE FUNCTION master_data.generate_pharmacy_platform_id()
RETURNS TEXT AS $$
  -- P02 + 6 random chars
  -- Example: P02mN8kL3
$$;
```
