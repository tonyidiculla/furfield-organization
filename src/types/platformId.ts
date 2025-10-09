// Platform ID Mapping Types
// Platform IDs follow the format: [CategoryCode][TypeCode][SequentialNumber]
// Example: H00000001 = Human (H) + General Type (00) + ID (000001)

export interface PlatformIdMapping {
    id: string
    category_code: string // First 1-3 characters (H, P, C, E, D, etc.)
    category_name: string // Human, Pet, Organization, Entity, Device, etc.
    category_description?: string
    type_code: string // Subdivision within category (00, 01, 02, etc.)
    type_name: string // Specific type name
    type_description?: string
    is_active: boolean
    created_at: string
    updated_at: string
}

// Platform ID Categories
export enum PlatformIdCategory {
    HUMAN = 'H',
    PET = 'P',
    ANIMAL = 'A',
    ORGANIZATION = 'C', // Company
    ENTITY = 'E',
    DEVICE = 'D',
    LOCATION = 'L',
    PRODUCT = 'R', // Resource
    SERVICE = 'S',
}

// Common Platform ID Types
export interface PlatformIdType {
    categoryCode: string
    typeCode: string
    name: string
    description?: string
}

// Platform ID breakdown
export interface ParsedPlatformId {
    full: string
    categoryCode: string
    typeCode: string
    sequentialNumber: string
    categoryName?: string
    typeName?: string
}

// Context-specific Platform IDs
export type UserPlatformId = string // H + type + number (e.g., H00000001)
export type OwnerPlatformId = string // Same as UserPlatformId, context: owner
export type ManagerPlatformId = string // Same as UserPlatformId, context: manager
export type PetPlatformId = string // P + type + number (e.g., P00000001)
export type OrganizationPlatformId = string // C + type + number (e.g., C00000001)
export type EntityPlatformId = string // E + type + number (e.g., E00000001)
export type DevicePlatformId = string // D + type + number (e.g., D00000001)

// Platform ID validation interface
export interface PlatformIdValidation {
    isValid: boolean
    category?: PlatformIdCategory
    error?: string
}
