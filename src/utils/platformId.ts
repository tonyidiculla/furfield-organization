import { 
    ParsedPlatformId, 
    PlatformIdCategory, 
    PlatformIdValidation 
} from '@/types/platformId'

/**
 * Platform ID Categories and their type codes
 * Based on master_data.platform_id_mapping table
 * 
 * Format: [CategoryCode][TypeCode][SequentialNumber]
 * Examples:
 * - H00000001 = Human + Default + ID 000001
 * - A01000123 = Animal + Canine + ID 000123
 * - C00000005 = Company + Default + ID 000005
 * - E01000010 = Entity + Hospital + ID 000010
 */
export const PLATFORM_ID_TYPES = {
    HUMAN: {
        code: 'H',
        name: 'Human',
        types: {
            '00': { name: 'Default', description: 'Default human category' }
        }
    },
    ANIMAL: {
        code: 'A',
        name: 'Animal',
        types: {
            '01': { name: 'Canine', description: 'Dogs and canine species' },
            '02': { name: 'Feline', description: 'Cats and feline species' },
            '03': { name: 'Avian', description: 'Birds and avian species' },
            '04': { name: 'Reptile', description: 'Reptiles and reptilian species' },
            '05': { name: 'Equine', description: 'Horses and equine species' },
            '06': { name: 'Bovine', description: 'Cattle and bovine species' }
        }
    },
    COMPANY: {
        code: 'C',
        name: 'Company',
        types: {
            '00': { name: 'Default', description: 'Company and organization entities' }
        }
    },
    ENTITY: {
        code: 'E',
        name: 'Entity',
        types: {
            '01': { name: 'Hospital', description: 'Hospital entities' },
            '02': { name: 'eStore', description: 'eStore entities' },
            '03': { name: 'Retail Store', description: 'Retail store entities' },
            '04': { name: 'Channel Partner', description: 'Channel partner entities' },
            '05': { name: 'Platform Support', description: 'Platform management and administration entities' }
        }
    }
} as const

/**
 * Parse a platform ID into its components
 */
export function parsePlatformId(platformId: string): ParsedPlatformId | null {
    if (!platformId || platformId.length < 4) {
        return null
    }

    const categoryCode = platformId.charAt(0)
    const typeCode = platformId.substring(1, 3)
    const sequentialNumber = platformId.substring(3)

    const categoryInfo = getCategoryInfo(categoryCode)
    const typeInfo = getTypeInfo(categoryCode, typeCode)

    return {
        full: platformId,
        categoryCode,
        typeCode,
        sequentialNumber,
        categoryName: categoryInfo?.name,
        typeName: typeInfo?.name
    }
}

/**
 * Get category information from category code
 */
export function getCategoryInfo(categoryCode: string): { name: string, code: string } | null {
    for (const category of Object.values(PLATFORM_ID_TYPES)) {
        if (category.code === categoryCode) {
            return { name: category.name, code: category.code }
        }
    }
    return null
}

/**
 * Get type information from category code and type code
 */
export function getTypeInfo(categoryCode: string, typeCode: string): { name: string, description: string } | null {
    for (const category of Object.values(PLATFORM_ID_TYPES)) {
        if (category.code === categoryCode) {
            const types = category.types as Record<string, { name: string, description: string }>
            const type = types[typeCode]
            return type ? { name: type.name, description: type.description } : null
        }
    }
    return null
}

/**
 * Validate a platform ID
 */
export function validatePlatformId(platformId: string): PlatformIdValidation {
    if (!platformId) {
        return { isValid: false, error: 'Platform ID is required' }
    }

    if (platformId.length < 4) {
        return { isValid: false, error: 'Platform ID must be at least 4 characters' }
    }

    const parsed = parsePlatformId(platformId)
    if (!parsed) {
        return { isValid: false, error: 'Invalid platform ID format' }
    }

    const categoryInfo = getCategoryInfo(parsed.categoryCode)
    if (!categoryInfo) {
        return { 
            isValid: false, 
            error: `Invalid category code: ${parsed.categoryCode}. Valid: H, A, C, E` 
        }
    }

    if (!/^\d{2}$/.test(parsed.typeCode)) {
        return { isValid: false, error: 'Type code must be 2 digits' }
    }

    const typeInfo = getTypeInfo(parsed.categoryCode, parsed.typeCode)
    if (!typeInfo) {
        return {
            isValid: false,
            error: `Invalid type code ${parsed.typeCode} for category ${parsed.categoryCode}`
        }
    }

    // Platform IDs can have either numeric or alphanumeric sequential parts
    // depending on the generation method used
    if (!/^[A-Za-z0-9]+$/.test(parsed.sequentialNumber)) {
        return { isValid: false, error: 'Sequential part must be alphanumeric' }
    }

    return { 
        isValid: true, 
        category: parsed.categoryCode as PlatformIdCategory 
    }
}

/**
 * Check if platform ID belongs to a specific category
 */
export function isPlatformIdCategory(platformId: string, categoryCode: string): boolean {
    const parsed = parsePlatformId(platformId)
    return parsed?.categoryCode === categoryCode
}

/**
 * Category check functions
 */
export function isHumanPlatformId(platformId: string): boolean {
    return isPlatformIdCategory(platformId, 'H')
}

export function isAnimalPlatformId(platformId: string): boolean {
    return isPlatformIdCategory(platformId, 'A')
}

export function isCompanyPlatformId(platformId: string): boolean {
    return isPlatformIdCategory(platformId, 'C')
}

export function isEntityPlatformId(platformId: string): boolean {
    return isPlatformIdCategory(platformId, 'E')
}

/**
 * Get specific type information
 */
export function getAnimalType(platformId: string): string | null {
    const parsed = parsePlatformId(platformId)
    if (!parsed || parsed.categoryCode !== 'A') return null
    return getTypeInfo('A', parsed.typeCode)?.name || null
}

export function getCompanyType(platformId: string): string | null {
    const parsed = parsePlatformId(platformId)
    if (!parsed || parsed.categoryCode !== 'C') return null
    return getTypeInfo('C', parsed.typeCode)?.name || null
}

export function getEntityType(platformId: string): string | null {
    const parsed = parsePlatformId(platformId)
    if (!parsed || parsed.categoryCode !== 'E') return null
    return getTypeInfo('E', parsed.typeCode)?.name || null
}

/**
 * Format platform ID with context for display
 */
export function formatPlatformIdWithContext(platformId: string): string {
    const parsed = parsePlatformId(platformId)
    if (!parsed) return platformId

    let context = parsed.categoryName || 'Unknown'
    if (parsed.typeName) {
        context += ` - ${parsed.typeName}`
    }

    return `${platformId} (${context})`
}

/**
 * Get placeholder text for platform ID input
 */
export function getPlatformIdPlaceholder(categoryCode: string, typeCode: string = '00'): string {
    return `${categoryCode}${typeCode}000001`
}

/**
 * Get all valid type codes for a category
 */
export function getValidTypeCodes(categoryCode: string): string[] {
    for (const category of Object.values(PLATFORM_ID_TYPES)) {
        if (category.code === categoryCode) {
            return Object.keys(category.types)
        }
    }
    return []
}

/**
 * Get example platform IDs for documentation
 */
export function getExamplePlatformIds(): Record<string, string[]> {
    return {
        Human: ['H00000001 - Default Human'],
        Animal: [
            'A01000001 - Canine (Dog)',
            'A02000001 - Feline (Cat)',
            'A03000001 - Avian (Bird)',
            'A04000001 - Reptile',
            'A05000001 - Equine (Horse)',
            'A06000001 - Bovine (Cattle)'
        ],
        Company: [
            'C00000001 - Company'
        ],
        Entity: [
            'E01000001 - Hospital',
            'E02000001 - eStore',
            'E03000001 - Retail Store',
            'E04000001 - Channel Partner',
            'E05000001 - Platform Support'
        ]
    }
}
