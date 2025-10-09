# User Search Implementation

## Overview
Implemented a real-time user search feature for assigning owners and managers to organizations, along with "assign myself" checkboxes for quick self-assignment.

## Components Created

### UserSearch Component (`src/components/UserSearch.tsx`)
A reusable search component that:
- Performs real-time search across the `profiles` table
- Searches by: first_name, last_name, email, and user_platform_id
- Features 300ms debounce for optimal performance
- Shows dropdown with user cards displaying full name, email, and platform ID
- Supports click-outside-to-close functionality
- Has clear button and loading indicator
- Returns selected user data via `onSelect` callback

**Interface:**
```typescript
interface UserSearchResult {
  user_id: string
  user_platform_id: string
  first_name: string
  last_name: string
  email: string
  full_name: string
}
```

**Usage:**
```tsx
<UserSearch
  onSelect={(selectedUser) => {
    // Handle selected user
  }}
  placeholder="Search by name, email, or platform ID..."
  selectedUserId={formData.owner_user_id}
/>
```

## Form Updates (`src/app/organization/[id]/edit/page.tsx`)

### Owner Section
- Replaced 4 separate text inputs (first name, last name, email, platform ID) with single `UserSearch` component
- Added "Assign myself as owner" checkbox in header
- Displays selected owner details in a card below the search
- Auto-populates: `owner_user_id`, `owner_platform_id`, `owner_first_name`, `owner_last_name`, `owner_email`

### Manager Section
- Replaced 4 separate text inputs with single `UserSearch` component  
- Added "Assign myself as manager" checkbox in header
- Displays selected manager details in a card below the search
- Includes optional phone field within the details card
- Auto-populates: `manager_id`, `manager_platform_id`, `manager_first_name`, `manager_last_name`, `manager_email`

### Current User Profile State
Added new state to fetch and store current user's profile data:
```typescript
const [currentUserProfile, setCurrentUserProfile] = useState<{
  user_id: string
  user_platform_id: string
  first_name: string
  last_name: string
  email: string
} | null>(null)
```

This data is fetched from the `master_data.profiles` table on component mount and used by the "assign myself" checkboxes.

### Database Fields
Updated form to load and save:
- `owner_user_id` - UUID reference to profiles table
- `manager_id` - UUID reference to profiles table

These fields are now included in:
1. Initial data fetch from database
2. Form state (`formData`)
3. Update payload sent to database

## Features

### Real-time Search
- Queries `master_data.profiles` table
- Uses Supabase `.or()` with `.ilike` for pattern matching
- Debounced to 300ms to reduce API calls
- Limits results to 10 users

### Self-Assignment Checkboxes
- Positioned in section headers next to "Owner Information" and "Manager Information"
- Checks current user's profile and auto-fills all fields
- Visual feedback: checkbox is checked when current user is assigned
- Only visible when `currentUserProfile` is loaded

### User Detail Cards
- Shows selected user information in a clean card format
- Displays: Name, Email, Platform ID
- Manager card includes optional phone field
- Helps users verify their selection before saving

## Technical Implementation

### Search Query
```typescript
const { data, error } = await supabase
  .schema('master_data')
  .from('profiles')
  .select('user_id, user_platform_id, first_name, last_name, email, full_name')
  .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,user_platform_id.ilike.%${query}%`)
  .limit(10)
```

### Debounce Pattern
```typescript
const timer = setTimeout(() => {
  searchUsers()
}, 300)
return () => clearTimeout(timer)
```

### Click-Outside Detection
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowDropdown(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```

## Benefits

1. **Better UX**: Single search field instead of manually typing 4+ separate fields
2. **Data Accuracy**: Selecting from existing users prevents typos and ensures valid references
3. **Speed**: Self-assignment checkboxes allow instant assignment
4. **Validation**: Platform ID validation happens automatically since users are selected from database
5. **Reusability**: UserSearch component can be used elsewhere in the application

## Testing Recommendations

1. Test search functionality with various queries (names, emails, platform IDs)
2. Verify "assign myself" checkbox correctly populates all fields
3. Test that selected user data persists after save
4. Verify UserSearch works for both owner and manager sections
5. Test click-outside-to-close behavior
6. Verify debounce is working (check network tab for API calls)
7. Test with users that have partial data (missing fields)
8. Verify platform ID validation still works with search-selected users

## Future Enhancements

Potential improvements:
- Add user avatars to search results
- Show user roles/permissions in dropdown
- Filter by user type (only show humans for owner/manager)
- Add recently selected users cache
- Support keyboard navigation (arrow keys, enter to select)
- Add "clear" button for selected user
- Show user's organization count or other metadata
