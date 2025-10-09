// Types for Organization data
export interface Organization {
    id: string
    organization_id: string
    organization_name: string
    organization_platform_id: string
    brand_name?: string
    logo_storage?: {
        url?: string
        file_path?: string
        storage_type?: string
    }
    website?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    country?: string
    postal_code?: string
    owner_platform_id: string // Links to profiles.user_platform_id
    manager_platform_id?: string
    manager_id?: string
    
    // Manager Information
    manager_first_name?: string
    manager_last_name?: string
    manager_email?: string
    manager_phone?: string
    
    // Owner Information
    owner_first_name?: string
    owner_last_name?: string
    owner_email?: string
    owner_user_id?: string
    
    // Business Registration
    business_registration_number?: string
    vat_gst_number?: string // Tax identification number (VAT/GST)
    incorporation_date?: string
    certificate_of_incorporation_url?: string
    business_type?: string // e.g., "LLC", "Corporation", "Partnership"
    
    // UI/Branding
    primary_color?: string // Hex color code, default '#3b82f6'
    accent_color?: string // Hex color code, default '#8b5cf6'
    secondary_color?: string // Hex color code, default '#64748b'
    theme_preference?: string // 'light' | 'dark' | 'auto'
    
    // Soft delete fields
    deleted_at?: string
    deleted_by?: string
    deletion_reason?: string
    
    is_active: string // 'active' | 'inactive'
    created_at: string
    updated_at: string
    notes?: string
    currency?: string
    language?: string
}

export interface OrganizationMember {
    id: string
    organization_id: string
    user_platform_id: string
    role: string
    is_active: boolean
    joined_at: string
}
