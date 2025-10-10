# Platform ID Immutability Implementation

## Overview

Platform IDs are permanent identifiers that cannot be changed once assigned to a user, organization, or entity. However, users CAN be reassigned to different roles (owner, manager, etc.).

## What is Immutable

### User Platform IDs

- Each user has a unique Platform ID (e.g., H00000001)
- **This ID never changes** - it's locked to that user permanently
- Users are "locked onto that unique number"

### Organization Platform IDs

- Each organization has a unique Platform ID (e.g., C00000001, E01000001)
- **This ID never changes** once assigned
- Cannot be edited after initial creation

### Manager Platform IDs

- When a manager is selected, their Platform ID is displayed
- **The Platform ID itself is immutable** (belongs to that specific user)
- But you CAN change WHO is assigned as the manager

### Owner Platform IDs

- When an owner is selected, their Platform ID is displayed
- **The Platform ID itself is immutable** (belongs to that specific user)
- But you CAN change WHO is assigned as the owner

## What is Mutable

### Role Assignments

- ✅ You CAN change who is the owner
- ✅ You CAN change who is the manager
- ✅ You CAN reassign users to different organizations
- ✅ Users can have multiple roles

The key principle: **The Platform ID is permanent to the entity/user, but role assignments are flexible.**

## Implementation Details

### Organization Platform ID Field

- **Input Field**: Disabled and read-only once a value exists
- **Visual Indicators**:
  - Shows "(Immutable)" label next to field name
  - Grayed out background (`bg-slate-100`)
  - Cursor shows `not-allowed`
  - Helper text: "Platform IDs cannot be changed once assigned"
- **Behavior**: Can only be set during creation, not edited afterward

### Owner Section

- **User Search**: Always enabled (can change who is owner)
- **"Assign myself" Checkbox**: Always available
- **Platform ID Display**: Shows 🔒 Immutable badge
- **Helper Text**: "You can change who is assigned as owner, but each user's Platform ID cannot be changed"
- **Visual**: Standard card styling (not locked appearance)

### Manager Section

- **User Search**: Always enabled (can change who is manager)
- **"Assign myself" Checkbox**: Always available
- **Platform ID Display**: Shows 🔒 Immutable badge
- **Helper Text**: "You can change who is assigned as manager, but each user's Platform ID cannot be changed"
- **Visual**: Standard card styling (not locked appearance)

## User Experience

### When Editing Organization

1. **Organization Platform ID**:

   - If already set → Grayed out, cannot edit
   - If new/empty → Can be set once

2. **Selecting Owner**:

   - Search for any user → Shows their Platform ID
   - Platform ID is displayed with 🔒 badge
   - User can select different owner anytime
   - Each selected user brings their immutable Platform ID

3. **Selecting Manager**:
   - Search for any user → Shows their Platform ID
   - Platform ID is displayed with 🔒 badge
   - User can select different manager anytime
   - Each selected user brings their immutable Platform ID

## Technical Implementation

### Form Fields

```typescript
// Organization Platform ID - disabled if exists
<input
  type="text"
  name="organization_platform_id"
  value={formData.organization_platform_id}
  readOnly={!!formData.organization_platform_id}
  disabled={!!formData.organization_platform_id}
  className={
    formData.organization_platform_id
      ? "cursor-not-allowed bg-slate-100 text-slate-600"
      : "border-slate-300 focus:border-sky-500"
  }
/>
```

### UserSearch Components

- No `disabled` prop applied
- Always functional for owner and manager selection
- Allows reassignment of roles

### Visual Indicators

```tsx
// Owner/Manager Platform ID display
<div>
  <span className="font-medium">Platform ID:</span> {platformId}
  <span className="ml-2 text-xs text-amber-600">🔒 Immutable</span>
</div>
```

### Helper Messages

- Organization field: "Platform IDs cannot be changed once assigned"
- Owner/Manager cards: "You can change who is assigned as [role], but each user's Platform ID cannot be changed"

## Database Behavior

### On Save

All Platform IDs are saved to database:

- `organization_platform_id` - locked after first save
- `owner_platform_id` - reflects currently selected owner's ID
- `owner_user_id` - references the user record
- `manager_platform_id` - reflects currently selected manager's ID
- `manager_id` - references the user record

### On Update

- Organization Platform ID: Not included in update if already exists
- Owner Platform ID: Updates to new owner's Platform ID when owner changes
- Manager Platform ID: Updates to new manager's Platform ID when manager changes

## Security Implications

### Benefits

1. **Audit Trail**: Platform IDs provide permanent tracking
2. **No ID Conflicts**: IDs never change, preventing confusion
3. **Data Integrity**: Users maintain consistent identity across system
4. **Historical Records**: Past assignments remain traceable

### Considerations

- Role assignments are flexible (owners/managers can change)
- Platform IDs in history records remain valid
- No risk of "orphaned" IDs from reassignments

## Future Enhancements

Potential improvements:

- Show history of owner/manager changes with Platform IDs
- Add "previous owners" audit log
- Validate Platform ID format before allowing save
- Prevent duplicate Platform ID assignments
- Add Platform ID lookup/search functionality
