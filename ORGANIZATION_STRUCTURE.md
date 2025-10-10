# Organization Repository Structure

This document explains the organized structure of the repository after cleanup.

## 📁 Root Directory Structure

```
organization/
├── src/                    # Application source code
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Library code (Supabase client, etc.)
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── docs/                  # Documentation
│   ├── api/              # API and RPC documentation
│   ├── database/         # Database schema and validation docs
│   ├── setup/            # Setup and configuration guides
│   └── troubleshooting/  # Troubleshooting guides
├── scripts/               # Utility scripts
│   ├── database/         # Database maintenance scripts
│   ├── maintenance/      # General maintenance scripts
│   └── utils/            # JavaScript utility scripts
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database migrations
│   ├── scripts/          # SQL setup and insert scripts
│   └── archive/          # Archived SQL files
│       ├── diagnostics/  # Diagnostic queries
│       └── fixes/        # Historical fix scripts
├── archive/              # Archived files
│   ├── old-sql/          # Old root-level SQL files
│   └── old-scripts/      # Old root-level scripts
└── .vscode/              # VS Code settings
```

## 📚 Documentation (`docs/`)

### API Documentation (`docs/api/`)
- `RPC_CLEANUP_SUMMARY.md` - RPC functions cleanup documentation
- `RPC_IMPLEMENTATION_SUMMARY.md` - Implementation details for RPC functions
- `USER_SEARCH_IMPLEMENTATION.md` - User search feature implementation
- `RPC_FUNCTIONS.md` - RPC functions reference
- `PRIVILEGE_SYSTEM.md` - Privilege and permission system documentation
- `STORAGE_SETUP.md` - Storage bucket setup guide

### Database Documentation (`docs/database/`)
- `DATABASE_FUNCTIONS_VALIDATION.md` - Database functions validation
- `MODULES_DIAGNOSTIC.md` - Module system diagnostics
- `MODULES_EMPTY_TABLE_FIX.md` - Module table fixes
- `MODULES_NOT_LOADING_FIX.md` - Module loading issue resolution
- `FUNCTION_CLEANUP_ANALYSIS.md` - Function cleanup analysis
- `CLEANUP_ANALYSIS.md` - General cleanup analysis
- `ORGANIZATION_FIELDS_UPDATE.md` - Organization fields update guide
- `ORGANIZATION_PLATFORM_ID_AUTO_GENERATION.md` - Platform ID generation
- `PLATFORM_ID_FORMAT.md` - Platform ID format specification
- `PLATFORM_ID_IMMUTABILITY.md` - Platform ID immutability rules
- `PLATFORM_ID_VALIDATION.md` - Platform ID validation
- `CORRECTED_VALIDATION_REPORT.md` - Validation report

### Setup Guides (`docs/setup/`)
- `REMOTE_SETUP.md` - Remote setup instructions
- `RUN_THIS_MIGRATION_FIRST.md` - Initial migration guide
- `STORAGE_BUCKET_SETUP.md` - Storage bucket configuration

### Troubleshooting (`docs/troubleshooting/`)
- `RLS_FIX.md` - Row Level Security fixes
- `RLS_POLICY_FIX.md` - RLS policy troubleshooting
- `GRANT_ACCESS_INSTRUCTIONS.md` - Access grant instructions

## 🛠️ Scripts (`scripts/`)

### Database Scripts (`scripts/database/`)
- Empty (ready for database maintenance scripts)

### Utility Scripts (`scripts/utils/`)
- `check-database-functions.js` - Database function checker
- `check_columns.js` - Column structure checker
- `check_columns_simple.js` - Simple column checker
- `check_org_after_update.js` - Organization update validator
- `query_platform_id_mapping.js` - Platform ID mapping query
- `test_update.js` - Update testing script

## 🗄️ Supabase (`supabase/`)

### Migrations (`supabase/migrations/`)
- Contains all database migration files
- `APPLY_MIGRATION.md` - Migration application guide

### Scripts (`supabase/scripts/`)
- `insert_hms_modules.sql` - HMS module insertion
- `step1_restore_privilege_levels.sql` - Privilege level restoration (Step 1)
- `step2_fix_rls_policy.sql` - RLS policy fixes (Step 2)

### Archive (`supabase/archive/`)

#### Diagnostics (`supabase/archive/diagnostics/`)
- All `check_*.sql` files - Diagnostic queries
- All `find_*.sql` files - Search queries
- All `query_*.sql` files - Database queries

#### Fixes (`supabase/archive/fixes/`)
- All `fix_*.sql` files - Historical fixes
- All `cleanup_*.sql` files - Cleanup scripts
- All `convert_*.sql` files - Data conversion scripts
- All `restore_*.sql` files - Restoration scripts
- All `test_*.sql` files - Test scripts

## 📦 Archive (`archive/`)

### Old SQL Files (`archive/old-sql/`)
- All SQL files that were previously in the root directory
- Kept for reference but no longer actively used

### Old Scripts (`archive/old-scripts/`)
- Empty (ready for future script archival)

## 🎯 Quick Reference

### Finding Files

**Looking for RLS documentation?**
→ `docs/troubleshooting/RLS_FIX.md`

**Need to run a migration?**
→ `supabase/migrations/` + `supabase/migrations/APPLY_MIGRATION.md`

**Want to check database functions?**
→ `scripts/utils/check-database-functions.js`

**Looking for old diagnostic queries?**
→ `supabase/archive/diagnostics/`

**Need API documentation?**
→ `docs/api/`

**Setting up the project?**
→ `docs/setup/`

## 🔄 Maintenance

### When to Archive
- SQL diagnostic files that have been used and are no longer needed
- Fix scripts that have been applied successfully
- Old documentation that has been superseded

### Where to Put New Files
- **New migrations**: `supabase/migrations/`
- **New documentation**: Appropriate folder in `docs/`
- **New utility scripts**: `scripts/utils/` or `scripts/database/`
- **New SQL scripts**: `supabase/scripts/`

## 📝 Notes

- The `archive/` directories preserve historical files for reference
- All active development should use the organized structure
- The `.gitignore` should be updated to exclude unnecessary archived files if needed
- Regular cleanup should move outdated files to archive directories

---

**Last Updated:** October 10, 2025
