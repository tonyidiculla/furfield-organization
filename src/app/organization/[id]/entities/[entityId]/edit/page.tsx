'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import CountrySelector from '@/components/CountrySelector'
import CurrencySelector from '@/components/CurrencySelector'
import { getCurrencyForCountry, getLanguageForCountry } from '@/hooks/useCountries'

interface Entity {
    entity_platform_id: string
    entity_name: string | null
    organization_platform_id: string | null
    logo_url: string | null
    hospital_type: string | null
    currency: string | null
    language: string | null
    manager_first_name: string | null
    manager_last_name: string | null
    manager_platform_id: string | null
    manager_email_id: string | null
    manager_phone_number: string | null
    address: string | null
    city: string | null
    state: string | null
    post_code: string | null
    country: string | null
    total_beds: number | null
    icu_beds: number | null
    treatment_rooms: number | null
    surgical_suites: number | null
    chief_veterinarian_name: string | null
    chief_veterinarian_contact: string | null
    veterinary_license_number: string | null
    veterinary_license_expiry: string | null
    accreditation_details: string | null
    operating_licenses: string | null
    services: any | null
    subscribed_modules: any[] | null
    subscription_start_date: string | null
    subscription_end_date: string | null
    subscription_status: string | null
    yearly_subscription_cost: number | null
    is_active: boolean
    created_at: string
}

interface Organization {
    organization_id: string
    organization_name: string
    organization_platform_id: string
}

export default function EditEntityPage() {
    const { user } = useUser()
    const router = useRouter()
    const params = useParams()
    const organizationPlatformId = params.id as string
    const entityPlatformId = params.entityId as string

    // Available service options
    const SERVICE_OPTIONS = [
        { value: 'preventive_care', label: 'Preventive care & wellness exams' },
        { value: 'vaccinations', label: 'Vaccinations & deworming' },
        { value: 'general_medicine', label: 'General medicine & consultations' },
        { value: 'routine_surgery', label: 'Routine surgery (spay/neuter)' },
        { value: 'advanced_specialty', label: 'Advanced specialty surgery' },
        { value: 'complex_surgery', label: 'Complex/critical surgery' },
        { value: 'emergency_24_7', label: '24/7 emergency care' },
        { value: 'intensive_care', label: 'Intensive care & hospitalization' },
        { value: 'diagnostic_imaging', label: 'Diagnostic imaging (X-ray, ultrasound, CT, MRI)' },
        { value: 'laboratory', label: 'Laboratory & diagnostic tests' },
        { value: 'dentistry', label: 'Dentistry & oral care' },
        { value: 'pharmacy', label: 'Pharmacy & medication dispensing' },
        { value: 'physiotherapy', label: 'Physiotherapy & rehabilitation' },
        { value: 'telemedicine', label: 'Telemedicine & remote consultations' },
        { value: 'boarding', label: 'Boarding & kennel facilities' },
        { value: 'grooming', label: 'Grooming & pet care' },
        { value: 'nutrition', label: 'Nutrition counseling' },
        { value: 'reproductive', label: 'Reproductive & breeding services' },
        { value: 'behavior', label: 'Behavior & training consultation' },
        { value: 'mobile_field', label: 'Mobile or field services' },
        { value: 'ambulance', label: 'Ambulance services' },
        { value: 'pet_identification', label: 'Pet identification (microchipping)' },
        { value: 'public_health', label: 'Public health (rabies control, disease surveillance)' },
        { value: 'subsidized_care', label: 'Subsidized or charitable care' },
        { value: 'teaching', label: 'Teaching & training for vet students' },
        { value: 'clinical_research', label: 'Clinical research & trials' }
    ]

    const [organization, setOrganization] = useState<Organization | null>(null)
    const [entity, setEntity] = useState<Entity | null>(null)
    const [loading, setLoading] = useState(false)
    const [fetchingData, setFetchingData] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // File upload refs and state
    const logoInputRef = useRef<HTMLInputElement>(null)
    const licenseInputRef = useRef<HTMLInputElement>(null)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [licenseFiles, setLicenseFiles] = useState<File[]>([])
    const [licenseFileNames, setLicenseFileNames] = useState<string[]>([])

    // Basic Information
    const [entityName, setEntityName] = useState('')
    const [hospitalType, setHospitalType] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [language, setLanguage] = useState('ENGLISH')
    
    // Manager Information
    const [managerFirstName, setManagerFirstName] = useState('')
    const [managerLastName, setManagerLastName] = useState('')
    const [managerEmail, setManagerEmail] = useState('')
    const [managerPhone, setManagerPhone] = useState('')
    const [managerPlatformId, setManagerPlatformId] = useState('')
    const [managerSearchQuery, setManagerSearchQuery] = useState('')
    const [managerSearchResults, setManagerSearchResults] = useState<any[]>([])
    const [showManagerDropdown, setShowManagerDropdown] = useState(false)
    
    // Location Information
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [postCode, setPostCode] = useState('')
    const [country, setCountry] = useState('')
    
    // Facility Capacity
    const [totalBeds, setTotalBeds] = useState('')
    const [icuBeds, setIcuBeds] = useState('')
    const [treatmentRooms, setTreatmentRooms] = useState('')
    const [surgicalSuites, setSurgicalSuites] = useState('')
    
    // Veterinary Information
    const [chiefVeterinarianName, setChiefVeterinarianName] = useState('')
    const [chiefVeterinarianContact, setChiefVeterinarianContact] = useState('')
    const [veterinaryLicenseNumber, setVeterinaryLicenseNumber] = useState('')
    const [veterinaryLicenseExpiry, setVeterinaryLicenseExpiry] = useState('')
    
    // Additional Information
    const [accreditationDetails, setAccreditationDetails] = useState('')
    const [operatingLicenses, setOperatingLicenses] = useState('')
    const [services, setServices] = useState('')
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    
    // Modules
    const [availableModules, setAvailableModules] = useState<any[]>([])
    const [selectedModules, setSelectedModules] = useState<number[]>([])
    
    // Location currency data for pricing calculations
    const [locationCurrency, setLocationCurrency] = useState<any>(null)
    
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        async function fetchData() {
            if (!organizationPlatformId || !entityPlatformId) return

            try {
                setFetchingData(true)

                // Fetch organization
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('organization_id, organization_name, organization_platform_id')
                    .eq('organization_platform_id', organizationPlatformId)
                    .single()

                if (orgError) throw orgError
                setOrganization(orgData)

                // Fetch entity from master_data schema
                const { data: entityData, error: entityError } = await supabase
                    .schema('master_data')
                    .from('hospitals')
                    .select('*')
                    .eq('entity_platform_id', entityPlatformId)
                    .single()

                if (entityError) throw entityError
                setEntity(entityData)
                
                console.log('Fetched entity data:', entityData)
                console.log('Country:', entityData.country, 'Currency:', entityData.currency)

                // Populate form fields - Basic Information
                setEntityName(entityData.entity_name || '')
                // hospital_type is stored as an array, get the first value
                setHospitalType(
                    Array.isArray(entityData.hospital_type) && entityData.hospital_type.length > 0
                        ? entityData.hospital_type[0]
                        : ''
                )
                setCurrency(entityData.currency || 'USD')
                setLanguage(entityData.language || 'ENGLISH')
                setLogoUrl(entityData.logo_url)
                
                // Manager Information
                setManagerFirstName(entityData.manager_first_name || '')
                setManagerLastName(entityData.manager_last_name || '')
                setManagerPlatformId(entityData.manager_platform_id || '')
                setManagerEmail(entityData.manager_email_id || '')
                setManagerPhone(entityData.manager_phone_number || '')
                
                // Location Information
                setAddress(entityData.address || '')
                setCity(entityData.city || '')
                setState(entityData.state || '')
                setPostCode(entityData.post_code || '')
                setCountry(entityData.country || '')
                
                // Facility Capacity
                setTotalBeds(entityData.total_beds?.toString() || '')
                setIcuBeds(entityData.icu_beds?.toString() || '')
                setTreatmentRooms(entityData.treatment_rooms?.toString() || '')
                setSurgicalSuites(entityData.surgical_suites?.toString() || '')
                
                // Veterinary Information
                setChiefVeterinarianName(entityData.chief_veterinarian_name || '')
                setChiefVeterinarianContact(entityData.chief_veterinarian_contact || '')
                setVeterinaryLicenseNumber(entityData.veterinary_license_number || '')
                setVeterinaryLicenseExpiry(entityData.veterinary_license_expiry || '')
                
                // Additional Information
                setAccreditationDetails(entityData.accreditation_details || '')
                // Handle operating_licenses - it might be an array from database
                setOperatingLicenses(
                    Array.isArray(entityData.operating_licenses) 
                        ? entityData.operating_licenses.join(', ') 
                        : entityData.operating_licenses || ''
                )
                setServices(entityData.services ? JSON.stringify(entityData.services, null, 2) : '')
                
                // Initialize selected services from services array
                if (entityData.services && Array.isArray(entityData.services)) {
                    setSelectedServices(entityData.services)
                } else {
                    setSelectedServices([])
                }
                
                // Initialize selected modules from subscribed_modules
                if (entityData.subscribed_modules && Array.isArray(entityData.subscribed_modules)) {
                    console.log('📦 Subscribed modules from DB:', entityData.subscribed_modules)
                    const subscribedModuleIds = entityData.subscribed_modules.map((m: any) => m.module_id)
                    console.log('📋 Extracted module IDs:', subscribedModuleIds)
                    setSelectedModules(subscribedModuleIds)
                } else {
                    console.log('⚠️ No subscribed_modules found in entity data')
                }
                
                setIsActive(entityData.is_active)
            } catch (err) {
                console.error('Error fetching data:', err)
                setError('Failed to load entity data')
            } finally {
                setFetchingData(false)
            }
        }

        fetchData()
    }, [organizationPlatformId, entityPlatformId])

    // Fetch HMS modules
    useEffect(() => {
        async function fetchModules() {
            try {
                const { data, error } = await supabase
                    .schema('master_data')
                    .from('modules')
                    .select('id, module_name, module_display_name, module_description, base_price, payment_frequency, solution_type, is_active')
                    .ilike('solution_type', '%hms%')
                    .eq('is_active', true)
                    .order('module_display_name', { ascending: true })

                if (error) {
                    console.error('Error fetching modules:', error)
                    return
                }
                
                if (data) {
                    console.log('🔍 Available modules:', data.map(m => ({ id: m.id, name: m.module_name })))
                    setAvailableModules(data)
                }
            } catch (err) {
                console.error('Exception in fetchModules:', err)
            }
        }

        fetchModules()
    }, [])

    // Note: Module selection is managed in the hospitals table, not a separate entity_modules table

    // Fetch location currency data for pricing calculations (based on country)
    useEffect(() => {
        async function fetchLocationCurrency() {
            if (!country) return

            try {
                const { data, error } = await supabase
                    .schema('master_data')
                    .from('location_currency')
                    .select('country_code, currency_code, ppp_multiplier, market_markup, tax_rate')
                    .eq('country_code', country)
                    .single()

                if (error) {
                    console.error('Error fetching location currency:', error)
                    // Set defaults if country data not found
                    setLocationCurrency({
                        currency_code: currency || 'USD',
                        ppp_multiplier: 1,
                        market_markup: 1,
                        tax_rate: 1
                    })
                } else {
                    setLocationCurrency(data)
                    // Auto-set currency from location data (currency is locked to country)
                    if (data.currency_code) {
                        setCurrency(data.currency_code)
                    }
                }
            } catch (err) {
                console.error('Error fetching location currency:', err)
                setLocationCurrency({
                    currency_code: currency || 'USD',
                    ppp_multiplier: 1,
                    market_markup: 1,
                    tax_rate: 1
                })
            }
        }

        fetchLocationCurrency()
    }, [country])

    // Search for managers
    useEffect(() => {
        async function searchManagers() {
            if (managerSearchQuery.length < 2) {
                setManagerSearchResults([])
                return
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('user_platform_id, first_name, last_name, email, phone')
                    .or(`first_name.ilike.%${managerSearchQuery}%,last_name.ilike.%${managerSearchQuery}%,email.ilike.%${managerSearchQuery}%,user_platform_id.ilike.%${managerSearchQuery}%`)
                    .limit(10)

                if (error) throw error
                setManagerSearchResults(data || [])
            } catch (err) {
                console.error('Error searching managers:', err)
            }
        }

        const debounce = setTimeout(searchManagers, 300)
        return () => clearTimeout(debounce)
    }, [managerSearchQuery])

    // Handle manager selection from search results
    const handleManagerSelect = (manager: any) => {
        setManagerPlatformId(manager.user_platform_id)
        setManagerFirstName(manager.first_name || '')
        setManagerLastName(manager.last_name || '')
        setManagerEmail(manager.email || '')
        setManagerPhone(manager.phone || '')
        setManagerSearchQuery(`${manager.first_name} ${manager.last_name} (${manager.user_platform_id})`)
        setShowManagerDropdown(false)
        setManagerSearchResults([])
    }

    // Clear manager selection
    const handleClearManager = () => {
        setManagerPlatformId('')
        setManagerFirstName('')
        setManagerLastName('')
        setManagerEmail('')
        setManagerPhone('')
        setManagerSearchQuery('')
        setManagerSearchResults([])
    }

    // Handle logo file selection
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            // Create preview URL
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoUrl(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    // Handle license files selection (multiple)
    const handleLicenseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            setLicenseFiles(prev => [...prev, ...files])
            setLicenseFileNames(prev => [...prev, ...files.map(f => f.name)])
        }
    }

    // Remove license file
    const removeLicenseFile = (index: number) => {
        setLicenseFiles(prev => prev.filter((_, i) => i !== index))
        setLicenseFileNames(prev => prev.filter((_, i) => i !== index))
    }

    // Get currency symbol based on currency code
    const getCurrencySymbol = (currencyCode: string): string => {
        const symbols: { [key: string]: string } = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CNY': '¥',
            'INR': '₹',
            'AUD': 'A$',
            'CAD': 'C$',
            'CHF': 'Fr',
            'SEK': 'kr',
            'NZD': 'NZ$',
            'KRW': '₩',
            'SGD': 'S$',
            'HKD': 'HK$',
            'NOK': 'kr',
            'MXN': '$',
            'BRL': 'R$',
            'ZAR': 'R',
            'RUB': '₽',
            'TRY': '₺',
            'AED': 'د.إ',
            'SAR': '﷼',
        }
        return symbols[currencyCode] || currencyCode
    }

    // Calculate customer price with PPP, market markup, and tax
    const calculateCustomerPrice = (basePrice: number): number => {
        if (!locationCurrency) return basePrice
        
        const price = basePrice * 
            (locationCurrency.ppp_multiplier || 1) * 
            (locationCurrency.market_markup || 1) * 
            (locationCurrency.tax_rate || 1)
        
        return price
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!entityName.trim()) {
            setError('Entity name is required')
            return
        }

        if (!user?.id) {
            setError('You must be logged in to edit an entity')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Upload logo if changed
            let uploadedLogoPath: string | null = null
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('hospital-logos')
                    .upload(filePath, logoFile)

                if (uploadError) throw uploadError
                uploadedLogoPath = filePath
            }

            // Upload license documents if provided
            const uploadedLicenses: any[] = []
            if (licenseFiles.length > 0) {
                for (const file of licenseFiles) {
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                    const filePath = `${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('entity-licenses')
                        .upload(filePath, file)

                    if (uploadError) {
                        console.error('Error uploading license:', uploadError)
                        continue
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('entity-licenses')
                        .getPublicUrl(filePath)

                    uploadedLicenses.push({
                        name: file.name,
                        url: publicUrl,
                        file_path: filePath,
                        storage_type: 'supabase',
                        uploaded_at: new Date().toISOString()
                    })
                }
            }

            // Parse arrays and JSON
            const licensesArray = operatingLicenses && operatingLicenses.trim()
                ? operatingLicenses.trim().split(',').map(s => s.trim()).filter(Boolean)
                : []
            
            // Use selectedServices array instead of parsing JSON
            const servicesArray = selectedServices.length > 0 ? selectedServices : null

            // Calculate subscription details
            const selectedModulesData = availableModules.filter(m => selectedModules.includes(m.id))
            
            // Get existing subscribed modules from entity data
            const existingModules = entity?.subscribed_modules || []
            const existingModuleMap = new Map(
                existingModules.map((m: any) => [m.module_id, m])
            )

            // Calculate subscription dates
            // If first time subscribing (no existing start date), set dates now
            // Otherwise, keep existing dates
            const subscriptionStartDate = entity?.subscription_start_date || new Date().toISOString()
            const subscriptionEndDate = entity?.subscription_end_date || (() => {
                const endDate = new Date()
                endDate.setFullYear(endDate.getFullYear() + 1)
                return endDate.toISOString()
            })()

            // Check if subscription is still active
            const now = new Date()
            const endDate = new Date(subscriptionEndDate)
            const isSubscriptionActive = endDate > now

            // Calculate remaining months for pro-rating new modules
            const remainingMonths = Math.max(0, 
                (endDate.getFullYear() - now.getFullYear()) * 12 + 
                (endDate.getMonth() - now.getMonth()) +
                (endDate.getDate() >= now.getDate() ? 0 : -1)
            )
            const proRateMultiplier = remainingMonths / 12 // Fraction of year remaining

            // Track pro-rated charges for new modules
            let additionalProRatedCost = 0

            // Build the final subscribed_modules array
            const subscribedModulesArray: any[] = []
            
            // Step 1: Keep ALL existing modules if subscription is still active
            if (isSubscriptionActive) {
                for (const existingModule of existingModules) {
                    const moduleId = existingModule.module_id
                    const availableModule = availableModules.find(m => m.id === moduleId)
                    
                    if (availableModule) {
                        // Module still exists in available modules - update prices
                        const fullYearPrice = calculateCustomerPrice(parseFloat(availableModule.base_price))
                        subscribedModulesArray.push({
                            ...existingModule,
                            base_price: parseFloat(availableModule.base_price),
                            customer_price: fullYearPrice,
                            payment_frequency: availableModule.payment_frequency,
                            module_display_name: availableModule.module_display_name,
                            updated_at: new Date().toISOString()
                        })
                    } else {
                        // Module no longer available but keep it (might be deprecated)
                        subscribedModulesArray.push(existingModule)
                    }
                }
            }

            // Step 2: Add newly selected modules (not already in existing)
            for (const module of selectedModulesData) {
                const existing = existingModuleMap.get(module.id)
                
                if (!existing) {
                    // New module subscription - calculate pro-rated cost
                    const fullYearPrice = calculateCustomerPrice(parseFloat(module.base_price))
                    const proRatedPrice = fullYearPrice * proRateMultiplier
                    additionalProRatedCost += proRatedPrice

                    subscribedModulesArray.push({
                        module_id: module.id,
                        module_name: module.module_name,
                        module_display_name: module.module_display_name,
                        base_price: parseFloat(module.base_price),
                        customer_price: fullYearPrice,
                        pro_rated_price: proRatedPrice,
                        remaining_months: remainingMonths,
                        payment_frequency: module.payment_frequency,
                        subscribed_at: new Date().toISOString()
                    })
                }
            }

            // Calculate total yearly subscription cost (full year for all modules)
            const yearlySubscriptionCost = selectedModulesData.reduce(
                (sum, m) => sum + calculateCustomerPrice(parseFloat(m.base_price)), 
                0
            )

            // Build update object
            const updateData: any = {
                entity_name: entityName.trim(),
                hospital_type: hospitalType ? [hospitalType] : null, // Store as array
                currency: currency || null,
                language: language || null,
                
                // Manager Information
                manager_first_name: managerFirstName.trim() || null,
                manager_last_name: managerLastName.trim() || null,
                manager_platform_id: managerPlatformId || null,
                manager_email_id: managerEmail.trim() || null,
                manager_phone_number: managerPhone.trim() || null,
                
                // Location
                address: address.trim() || null,
                city: city.trim() || null,
                state: state.trim() || null,
                post_code: postCode.trim() || null,
                country: country || null,
                
                // Facility Capacity
                total_beds: totalBeds ? parseInt(totalBeds) : 0,
                icu_beds: icuBeds ? parseInt(icuBeds) : 0,
                treatment_rooms: treatmentRooms ? parseInt(treatmentRooms) : 0,
                surgical_suites: surgicalSuites ? parseInt(surgicalSuites) : 0,
                
                // Veterinary Information
                chief_veterinarian_name: chiefVeterinarianName.trim() || null,
                chief_veterinarian_contact: chiefVeterinarianContact.trim() || null,
                veterinary_license_number: veterinaryLicenseNumber.trim() || null,
                veterinary_license_expiry: veterinaryLicenseExpiry || null,
                
                // Additional Information
                accreditation_details: accreditationDetails.trim() || null,
                operating_licenses: licensesArray.length > 0 ? licensesArray : null,
                services: servicesArray,
                
                // Subscription Information
                subscribed_modules: subscribedModulesArray,
                subscription_start_date: subscriptionStartDate,
                subscription_end_date: subscriptionEndDate,
                subscription_status: 'active',
                yearly_subscription_cost: yearlySubscriptionCost,
                
                is_active: isActive
            }

            // Add logo if uploaded
            if (uploadedLogoPath) {
                updateData.logo_storage = {
                    url: supabase.storage.from('hospital-logos').getPublicUrl(uploadedLogoPath).data.publicUrl,
                    file_path: uploadedLogoPath,
                    storage_type: 'supabase'
                }
            }

            // Add license documents if uploaded
            if (uploadedLicenses.length > 0) {
                updateData.license_documents = uploadedLicenses
            }

            console.log('Updating entity with data:', updateData)
            console.log('Subscribed modules count:', subscribedModulesArray.length)

            const { error: updateError } = await supabase
                .schema('master_data')
                .from('hospitals')
                .update(updateData)
                .eq('entity_platform_id', entityPlatformId)

            if (updateError) {
                console.error('❌ Error updating entity:', updateError)
                alert(`Failed to save: ${updateError.message || JSON.stringify(updateError)}`)
                throw updateError
            }

            console.log('✅ Entity updated successfully!')
            
            // Module selection is stored in the hospitals table only
            // No separate entity_modules junction table is used

            // Redirect to HMS home page
            router.push(`/organization/${organizationPlatformId}/entities/${entityPlatformId}/hms`)
        } catch (err) {
            console.error('❌ Error updating entity:', err)
            const errorMessage = err instanceof Error ? err.message : 'Failed to update entity'
            setError(errorMessage)
            alert(`Error: ${errorMessage}`)
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-gray-600">Please log in to edit an entity</p>
                </div>
            </div>
        )
    }

    if (fetchingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-gray-600 mt-4">Loading entity data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push(`/organization/${organizationPlatformId}/entities`)}
                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to Entities</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Edit Entity</h1>
                            {organization && (
                                <p className="text-gray-600 mt-1">
                                    {organization.organization_name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-8">
                    {/* Entity Information */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Entity Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Logo Upload */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Hospital Logo
                                </label>
                                <div className="flex items-center gap-4">
                                    {logoUrl && (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                                            <img
                                                src={logoUrl}
                                                alt="Hospital logo"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => logoInputRef.current?.click()}
                                            className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
                                        >
                                            {logoUrl ? 'Change Logo' : 'Upload Logo'}
                                        </button>
                                        <p className="text-xs text-gray-500 mt-1">Recommended: Square image, at least 200x200px</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hospital Platform ID
                                </label>
                                <input
                                    type="text"
                                    value={entityPlatformId}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                />
                                <p className="mt-1 text-xs text-gray-500">Auto-generated unique identifier</p>
                            </div>
                            <div>
                                <label htmlFor="entityName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Hospital Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="entityName"
                                    value={entityName}
                                    onChange={(e) => setEntityName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Enter hospital name"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="hospitalType" className="block text-sm font-medium text-gray-700 mb-1">
                                    Hospital Type
                                </label>
                                <select
                                    id="hospitalType"
                                    value={hospitalType}
                                    onChange={(e) => setHospitalType(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                                >
                                    <option value="">Select hospital type...</option>
                                    <option value="solo_neighborhood_clinic">Solo / Neighborhood Clinic</option>
                                    <option value="multi_vet_general">Multi-Vet General Hospital</option>
                                    <option value="specialty_referral">Specialty & Referral Center</option>
                                    <option value="emergency_critical">Emergency & Critical Care Hospital</option>
                                    <option value="full_service_medical">Full-Service Animal Medical Center</option>
                                    <option value="teaching_university">Teaching / University Hospital</option>
                                    <option value="government_ngo">Government / NGO Hospital</option>
                                    <option value="mobile_field">Mobile / Field Practice</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="operatingLicenses" className="block text-sm font-medium text-gray-700 mb-1">
                                    Operating Licenses
                                </label>
                                <input
                                    type="text"
                                    id="operatingLicenses"
                                    value={operatingLicenses}
                                    onChange={(e) => setOperatingLicenses(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Enter licenses separated by commas (e.g., LIC-001, LIC-002)"
                                />
                                <div className="mt-2 flex items-center gap-2">
                                    <input
                                        ref={licenseInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                        multiple
                                        onChange={handleLicenseChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => licenseInputRef.current?.click()}
                                        className="px-3 py-1.5 border border-emerald-300 text-emerald-700 rounded-md hover:bg-emerald-50 transition-colors text-xs font-medium"
                                    >
                                        <svg className="w-3 h-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Upload Documents
                                    </button>
                                    {licenseFileNames.length > 0 && (
                                        <span className="text-xs text-gray-600">{licenseFileNames.length} file(s) attached</span>
                                    )}
                                </div>
                                {licenseFileNames.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {licenseFileNames.map((name, index) => (
                                            <div key={index} className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded text-xs">
                                                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-gray-700 max-w-[150px] truncate">{name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeLicenseFile(index)}
                                                    className="text-red-600 hover:text-red-700 ml-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Active</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Facility Capacity */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Facility Capacity
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label htmlFor="totalBeds" className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Beds
                                </label>
                                <input
                                    type="number"
                                    id="totalBeds"
                                    value={totalBeds}
                                    onChange={(e) => setTotalBeds(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="icuBeds" className="block text-sm font-medium text-gray-700 mb-1">
                                    ICU Beds
                                </label>
                                <input
                                    type="number"
                                    id="icuBeds"
                                    value={icuBeds}
                                    onChange={(e) => setIcuBeds(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="treatmentRooms" className="block text-sm font-medium text-gray-700 mb-1">
                                    Treatment Rooms
                                </label>
                                <input
                                    type="number"
                                    id="treatmentRooms"
                                    value={treatmentRooms}
                                    onChange={(e) => setTreatmentRooms(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label htmlFor="surgicalSuites" className="block text-sm font-medium text-gray-700 mb-1">
                                    Surgical Suites
                                </label>
                                <input
                                    type="number"
                                    id="surgicalSuites"
                                    value={surgicalSuites}
                                    onChange={(e) => setSurgicalSuites(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Manager Information */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Manager Information
                        </h2>
                        
                        {/* Manager Search */}
                        <div className="mb-4 relative">
                            <label htmlFor="managerSearch" className="block text-sm font-medium text-gray-700 mb-1">
                                Search People
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="managerSearch"
                                    value={managerSearchQuery}
                                    onChange={(e) => {
                                        setManagerSearchQuery(e.target.value)
                                        setShowManagerDropdown(true)
                                    }}
                                    onFocus={() => setShowManagerDropdown(true)}
                                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Search by name, email, or ID..."
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {managerPlatformId && (
                                    <button
                                        type="button"
                                        onClick={handleClearManager}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            
                            {/* Search Results Dropdown */}
                            {showManagerDropdown && managerSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {managerSearchResults.map((manager) => (
                                        <button
                                            key={manager.user_platform_id}
                                            type="button"
                                            onClick={() => handleManagerSelect(manager)}
                                            className="w-full px-4 py-3 text-left hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                        >
                                            <div className="font-medium text-gray-900">
                                                {manager.first_name} {manager.last_name}
                                            </div>
                                            <div className="text-sm text-gray-600">{manager.email}</div>
                                            <div className="text-xs text-gray-500 mt-1">ID: {manager.user_platform_id}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Manager Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {managerPlatformId && (
                                <div className="md:col-span-2">
                                    <label htmlFor="managerPlatformId" className="block text-sm font-medium text-gray-700 mb-1">
                                        Manager Platform ID
                                    </label>
                                    <input
                                        type="text"
                                        id="managerPlatformId"
                                        value={managerPlatformId}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                        disabled
                                        readOnly
                                    />
                                </div>
                            )}
                            <div>
                                <label htmlFor="managerFirstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    id="managerFirstName"
                                    value={managerFirstName}
                                    onChange={(e) => setManagerFirstName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="First name"
                                    disabled={!!managerPlatformId}
                                />
                            </div>
                            <div>
                                <label htmlFor="managerLastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    id="managerLastName"
                                    value={managerLastName}
                                    onChange={(e) => setManagerLastName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Last name"
                                    disabled={!!managerPlatformId}
                                />
                            </div>
                            <div>
                                <label htmlFor="managerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="managerEmail"
                                    value={managerEmail}
                                    onChange={(e) => setManagerEmail(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="manager@example.com"
                                    disabled={!!managerPlatformId}
                                />
                            </div>
                            <div>
                                <label htmlFor="managerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    id="managerPhone"
                                    value={managerPhone}
                                    onChange={(e) => setManagerPhone(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="+1 (555) 123-4567"
                                    disabled={!!managerPlatformId}
                                />
                            </div>
                            {managerPlatformId && (
                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Manager selected: {managerPlatformId}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location Information */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Location Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Street address"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                                        City
                                    </label>
                                    <input
                                        type="text"
                                        id="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="City"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                        State/Province
                                    </label>
                                    <input
                                        type="text"
                                        id="state"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="State/Province"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="postCode" className="block text-sm font-medium text-gray-700 mb-1">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        id="postCode"
                                        value={postCode}
                                        onChange={(e) => setPostCode(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="12345"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                                        Country <span className="text-xs text-gray-500">(Cannot be changed)</span>
                                    </label>
                                    <CountrySelector
                                        value={country}
                                        onChange={(countryCode) => {
                                            // Country is locked after creation, no changes allowed
                                            console.log('Country cannot be changed after entity creation')
                                        }}
                                        disabled={true}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                                        Currency <span className="text-xs text-gray-500">(Auto-set by country)</span>
                                    </label>
                                    <CurrencySelector
                                        value={currency}
                                        onChange={(value) => {
                                            // Currency is locked to country, no manual changes allowed
                                            console.log('Currency is automatically set based on country selection')
                                        }}
                                        disabled={true}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                                        Primary Language
                                    </label>
                                    <input
                                        type="text"
                                        id="language"
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="e.g., ENGLISH"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Veterinarian Information */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Veterinarian Information
                        </h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="chiefVeterinarianName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Chief Veterinarian Name
                                    </label>
                                    <input
                                        type="text"
                                        id="chiefVeterinarianName"
                                        value={chiefVeterinarianName}
                                        onChange={(e) => setChiefVeterinarianName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Dr. John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="chiefVeterinarianContact" className="block text-sm font-medium text-gray-700 mb-1">
                                        Chief Veterinarian Contact
                                    </label>
                                    <input
                                        type="tel"
                                        id="chiefVeterinarianContact"
                                        value={chiefVeterinarianContact}
                                        onChange={(e) => setChiefVeterinarianContact(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="veterinaryLicenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        Veterinary License Number
                                    </label>
                                    <input
                                        type="text"
                                        id="veterinaryLicenseNumber"
                                        value={veterinaryLicenseNumber}
                                        onChange={(e) => setVeterinaryLicenseNumber(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="VET-12345"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="veterinaryLicenseExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                                        License Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        id="veterinaryLicenseExpiry"
                                        value={veterinaryLicenseExpiry}
                                        onChange={(e) => setVeterinaryLicenseExpiry(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Additional Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="accreditationDetails" className="block text-sm font-medium text-gray-700 mb-1">
                                    Accreditation List (comma-separated)
                                </label>
                                <textarea
                                    id="accreditationDetails"
                                    value={accreditationDetails}
                                    onChange={(e) => setAccreditationDetails(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Enter accreditations separated by commas (e.g., AAHA, ISO 9001, VECCS)"
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Services Offered
                                    <span className="ml-2 text-xs text-gray-500">
                                        ({selectedServices.length} selected)
                                    </span>
                                </label>
                                <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        {SERVICE_OPTIONS.map((service) => (
                                            <label
                                                key={service.value}
                                                className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedServices.includes(service.value)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedServices([...selectedServices, service.value])
                                                        } else {
                                                            setSelectedServices(selectedServices.filter(s => s !== service.value))
                                                        }
                                                    }}
                                                    className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded flex-shrink-0"
                                                />
                                                <span className="text-sm text-gray-700 flex-1 leading-snug">
                                                    {service.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                {selectedServices.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {selectedServices.map((serviceValue) => {
                                            const service = SERVICE_OPTIONS.find(s => s.value === serviceValue)
                                            return service ? (
                                                <span
                                                    key={serviceValue}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full"
                                                >
                                                    {service.label}
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedServices(selectedServices.filter(s => s !== serviceValue))}
                                                        className="hover:text-emerald-900"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ) : null
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Module Selection */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Hospital Management Modules
                        </h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Select the modules you want to activate for this hospital.
                        </p>
                        {availableModules.length === 0 && (
                            <div className="p-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg text-center">
                                <p className="text-lg font-semibold text-yellow-800 mb-2">⏳ Loading modules...</p>
                                <p className="text-sm text-yellow-700">
                                    If modules don't appear, check the browser console (F12) for error details.
                                </p>
                            </div>
                        )}
                        {availableModules.length > 0 && (
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="w-12 px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedModules.length === availableModules.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedModules(availableModules.map(m => m.id))
                                                        } else {
                                                            setSelectedModules([])
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                />
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Module Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Frequency
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {availableModules.map((module) => {
                                            const existingModules = entity?.subscribed_modules || []
                                            const isCurrentlySubscribed = existingModules.some((m: any) => m.module_id === module.id)
                                            const existingModule = existingModules.find((m: any) => m.module_id === module.id)
                                            
                                            return (
                                                <tr
                                                    key={module.id}
                                                    className={`cursor-pointer transition-colors ${
                                                        selectedModules.includes(module.id)
                                                            ? isCurrentlySubscribed
                                                                ? 'bg-blue-50 hover:bg-blue-100'
                                                                : 'bg-emerald-50 hover:bg-emerald-100'
                                                            : 'hover:bg-gray-50'
                                                    }`}
                                                    onClick={() => {
                                                        if (selectedModules.includes(module.id)) {
                                                            setSelectedModules(selectedModules.filter(id => id !== module.id))
                                                        } else {
                                                            setSelectedModules([...selectedModules, module.id])
                                                        }
                                                    }}
                                                >
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedModules.includes(module.id)}
                                                            onChange={() => {}}
                                                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {module.module_display_name}
                                                                    </span>
                                                                    {isCurrentlySubscribed && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                            ✓ Active
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {module.module_name}
                                                                </div>
                                                                {isCurrentlySubscribed && existingModule?.subscribed_at && (
                                                                    <div className="text-xs text-blue-600 mt-1">
                                                                        Subscribed: {new Date(existingModule.subscribed_at).toLocaleDateString()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 max-w-md">
                                                        {module.module_description || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {module.base_price > 0 ? (
                                                        <div className="text-sm font-semibold text-emerald-600">
                                                            {getCurrencySymbol(currency)}{calculateCustomerPrice(parseFloat(module.base_price)).toFixed(2)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-500">Free</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        module.payment_frequency === 'monthly' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : module.payment_frequency === 'yearly'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {module.payment_frequency === 'monthly' 
                                                            ? 'Monthly' 
                                                            : module.payment_frequency === 'yearly'
                                                            ? 'Yearly'
                                                            : 'One-time'}
                                                    </span>
                                                </td>
                                            </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {selectedModules.length > 0 && (
                            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <p className="text-sm font-medium text-emerald-800 mb-2">
                                    {selectedModules.length} module(s) selected
                                </p>
                                {(() => {
                                    const selectedModulesData = availableModules.filter(m => selectedModules.includes(m.id))
                                    const yearlyTotal = selectedModulesData
                                        .reduce((sum, m) => sum + calculateCustomerPrice(parseFloat(m.base_price)), 0)
                                    
                                    // Calculate pro-rated cost for new modules
                                    const existingModules = entity?.subscribed_modules || []
                                    const existingModuleIds = new Set(existingModules.map((m: any) => m.module_id))
                                    const newModules = selectedModulesData.filter(m => !existingModuleIds.has(m.id))
                                    
                                    if (newModules.length > 0 && entity?.subscription_end_date) {
                                        const now = new Date()
                                        const endDate = new Date(entity.subscription_end_date)
                                        const remainingMonths = Math.max(0, 
                                            (endDate.getFullYear() - now.getFullYear()) * 12 + 
                                            (endDate.getMonth() - now.getMonth()) +
                                            (endDate.getDate() >= now.getDate() ? 0 : -1)
                                        )
                                        
                                        const proRatedCost = newModules.reduce((sum, m) => {
                                            const fullPrice = calculateCustomerPrice(parseFloat(m.base_price))
                                            return sum + (fullPrice * remainingMonths / 12)
                                        }, 0)
                                        
                                        return (
                                            <div className="space-y-2">
                                                <p className="text-sm text-emerald-700">
                                                    Annual Subscription Cost: <span className="font-bold">{getCurrencySymbol(currency)}{yearlyTotal.toFixed(2)}/year</span>
                                                </p>
                                                <div className="pt-2 border-t border-emerald-300">
                                                    <p className="text-xs text-emerald-600 mb-1">
                                                        ℹ️ {newModules.length} new module(s) detected
                                                    </p>
                                                    <p className="text-sm text-orange-700 font-medium">
                                                        Pro-rated cost ({remainingMonths} months): <span className="font-bold">{getCurrencySymbol(currency)}{proRatedCost.toFixed(2)}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        Subscription renews: {new Date(entity.subscription_end_date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }
                                    
                                    return (
                                        <div className="space-y-1">
                                            <p className="text-sm text-emerald-700">
                                                Annual Subscription Cost: <span className="font-bold">{getCurrencySymbol(currency)}{yearlyTotal.toFixed(2)}/year</span>
                                            </p>
                                        </div>
                                    )
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => router.push(`/organization/${organizationPlatformId}/entities`)}
                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
