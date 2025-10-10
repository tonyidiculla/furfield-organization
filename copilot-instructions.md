# Copilot Instructions for Organization Management System

## Platform ID Generation Standards

### **CRITICAL: Always use sequential numeric IDs, never random characters**

All platform IDs in this system follow a strict sequential format:

### Organizations
- **Format**: `O` + 2-digit sequential number
- **Examples**: O01, O02, O03, ..., O10, O11, ..., O99
- **Table**: `master_data.organizations`
- **Column**: `organization_platform_id`
- **Function**: `master_data.generate_organization_platform_id()`
- **Note**: Sequential numbering for organizations (different from entity random pattern)

### Entities (Hospitals)
- **Format**: `E01` + 6 random alphanumeric characters (9 continuous characters, no hyphens)
- **Structure**: E (Entity) + 01 (Hospital type) + XXXXXX (random)
- **Examples**: E01aB3xY9, E01Zk7mN2, E019QpXw4, E01YxOKdV
- **Character Set**: A-Z, a-z, 0-9 (62 possible characters for random part)
- **Table**: `master_data.hospitals`
- **Column**: `entity_platform_id`
- **Function**: `master_data.generate_entity_platform_id()`
- **Note**: The "01" allows for future entity types (02 for clinics, 03 for labs, etc.)

### Users/Profiles
- **Format**: `U` + 2-digit sequential number
- **Examples**: U01, U02, U03, ..., U10, U11, ..., U99
- **Table**: `master_data.profiles`
- **Column**: `user_platform_id`
- **Function**: `master_data.generate_user_platform_id()`

## Form UI Standards

### Logo Upload Section
- **Always use**: "Click to upload logo" text (NOT a button)
- **Structure**:
  ```tsx
  <div className="flex items-center gap-4">
    <div onClick={() => fileInputRef.current?.click()}>
      {/* 24x24 preview box */}
    </div>
    <div className="text-sm text-slate-600">
      <p className="font-medium">Click to upload logo</p>
      <p className="text-xs text-slate-500">PNG, JPG or WebP (max 2MB)</p>
    </div>
  </div>
  ```
- **NO "Choose File" or "Upload" buttons**
- Reference: `/src/app/organization/create/page.tsx` lines 437-465

### Currency and Language Fields
- **Location**: Always in the "Location Information" section with address fields
- **Behavior**: Auto-populate when country is selected
- **Integration**: Use `location_currency` table lookup
- **Order**: Country → Currency → Language
- **Components**: 
  - CountrySelector (from `@/components/ui/country-selector`)
  - CurrencySelector (from `@/components/ui/currency-selector`)
- **Auto-fill logic**:
  ```tsx
  const handleCountryChange = async (value: string) => {
    setCountry(value);
    const defaultCurrency = await getCurrencyForCountry(value);
    const defaultLanguage = await getLanguageForCountry(value);
    if (defaultCurrency) setCurrency(defaultCurrency);
    if (defaultLanguage) setLanguage(defaultLanguage);
  };
  ```

## Database Tables

### location_currency
- **Schema**: `master_data.location_currency`
- **Key columns**:
  - `country_code` (VARCHAR, primary key part)
  - `currency_code` (VARCHAR)
  - `currency_name` (VARCHAR)
  - `language_code` (VARCHAR)
  - `language_name` (VARCHAR)
  - `is_active` (BOOLEAN)

## Storage Buckets

### Organization Logos
- **Bucket**: `organization-logos`
- **Public**: false
- **File naming**: `{timestamp}_{random}.{ext}`

### Hospital/Entity Logos
- **Bucket**: `hospital-logos`
- **Public**: false
- **File naming**: `{timestamp}_{random}.{ext}`

### Entity Licenses
- **Bucket**: `entity-licenses`
- **Public**: false
- **File naming**: `{timestamp}_{random}.{ext}`

## Form Consistency Rules

1. **Logo section always at top of form** (first section after `<form>`)
2. **Use "Click to upload" text, not buttons**
3. **Currency and language in Location section**, not Entity/Organization Information
4. **Manager search** should show `manager_platform_id` when selected
5. **Platform IDs** should be auto-generated, read-only, gray background
6. **All forms** (create/edit) should have identical field layouts and sections

## Phone Number Validation
- **Format**: Country code + number (e.g., +1234567890)
- **Implementation**: TODO - Add validation in future updates

## Testing Checklist
- [ ] Platform ID generates sequentially (O01, E01, etc.)
- [ ] Logo upload shows "Click to upload logo" text
- [ ] Currency and language in Location section
- [ ] Country selection auto-fills currency and language
- [ ] Manager search shows platform ID
- [ ] All file uploads work (logo, licenses, certificates)
