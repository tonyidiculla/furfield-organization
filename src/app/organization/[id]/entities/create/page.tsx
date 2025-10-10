'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import CountrySelector from '@/components/CountrySelector'
import CurrencySelector from '@/components/CurrencySelector'
import { getCurrencyForCountry, getLanguageForCountry } from '@/hooks/useCountries'

interface Organization {
    organization_id: string
    organization_name: string
    organization_platform_id: string
}

export default function HospitalEntityCreation() {
    const { user } = useUser()
    const router = useRouter()
    const params = useParams()
    const organizationPlatformId = params.id as string

    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    // File upload refs and state
    const logoInputRef = useRef<HTMLInputElement>(null)
    const licenseInputRef = useRef<HTMLInputElement>(null)
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [licenseFiles, setLicenseFiles] = useState<File[]>([])
    const [licenseFileNames, setLicenseFileNames] = useState<string[]>([])

    // Basic Information
    const [entityPlatformId, setEntityPlatformId] = useState('')
    const [entityName, setEntityName] = useState('')
    const [hospitalType, setHospitalType] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [language, setLanguage] = useState('ENGLISH')
    
    // Location Information
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [postCode, setPostCode] = useState('')
    const [country, setCountry] = useState('')
    
    // Manager Information
    const [managerFirstName, setManagerFirstName] = useState('')
    const [managerLastName, setManagerLastName] = useState('')
    const [managerEmail, setManagerEmail] = useState('')
    const [managerPhone, setManagerPhone] = useState('')
    const [managerPlatformId, setManagerPlatformId] = useState('')
    const [managerSearchQuery, setManagerSearchQuery] = useState('')
    const [managerSearchResults, setManagerSearchResults] = useState<any[]>([])
    const [showManagerDropdown, setShowManagerDropdown] = useState(false)
    
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
    
    // Modules
    const [availableModules, setAvailableModules] = useState<any[]>([])
    const [selectedModules, setSelectedModules] = useState<number[]>([])
    
    // Location currency data for pricing calculations
    const [locationCurrency, setLocationCurrency] = useState<any>(null)

    useEffect(() => {
        async function fetchOrganization() {
            if (!organizationPlatformId) return

            try {
                const { data, error } = await supabase
                    .from('organizations')
                    .select('organization_id, organization_name, organization_platform_id')
                    .eq('organization_platform_id', organizationPlatformId)
                    .single()

                if (error) throw error
                setOrganization(data)
            } catch (err) {
                console.error('Error fetching organization:', err)
                setError('Failed to load organization')
            }
        }

        fetchOrganization()
    }, [organizationPlatformId])

    // Fetch HMS modules
    useEffect(() => {
        async function fetchModules() {
            console.log('🔄 Starting to fetch modules...')
            console.log('   Query: SELECT * FROM master_data.modules')
            console.log('   WHERE: solution_type ILIKE "%hms%" AND is_active = true')
            
            // First, fetch ALL modules to see what's in the table
            try {
                const { data: allModules, error: allError } = await supabase
                    .schema('master_data')
                    .from('modules')
                    .select('id, module_name, solution_type, is_active')
                    .order('module_name', { ascending: true })
                
                console.log('📊 ALL MODULES IN DATABASE:', allModules?.length || 0)
                if (allModules && allModules.length > 0) {
                    console.table(allModules)
                    console.log('   Solution types found:', [...new Set(allModules.map(m => m.solution_type))])
                    console.log('   Active modules:', allModules.filter(m => m.is_active).length)
                } else {
                    console.warn('   ⚠️ No modules found in master_data.modules table at all!')
                }
            } catch (err) {
                console.error('   Error fetching all modules:', err)
            }
            
            try {
                const { data, error } = await supabase
                    .schema('master_data')
                    .from('modules')
                    .select('id, module_name, module_display_name, module_description, base_price, payment_frequency, solution_type, is_active')
                    .ilike('solution_type', '%hms%')
                    .eq('is_active', true)
                    .order('module_display_name', { ascending: true })

                if (error) {
                    console.error('❌ ERROR FETCHING MODULES:')
                    console.error('   Code:', error.code)
                    console.error('   Message:', error.message)
                    console.error('   Details:', error.details)
                    console.error('   Hint:', error.hint)
                    alert(`⚠️ Error loading modules: ${error.message}\n\nCode: ${error.code}\n\nPlease run GRANT permissions SQL in Supabase.`)
                    return
                }
                
                if (!data || data.length === 0) {
                    console.warn('⚠️ No HMS modules found in database')
                    console.warn('   The query succeeded but returned 0 results.')
                    console.warn('   Possible reasons:')
                    console.warn('   1. modules table is empty')
                    console.warn('   2. No modules have solution_type containing "HMS"')
                    console.warn('   3. No modules have is_active = true')
                    console.warn('')
                    console.warn('   📝 Run this SQL in Supabase to insert sample data:')
                    console.warn('   File: supabase/check_and_insert_modules.sql')
                    alert('⚠️ No HMS modules found in database.\n\nThe query succeeded, but no modules match:\n- solution_type ILIKE "%hms%"\n- is_active = true\n\nPlease insert HMS modules or check your data.')
                    return
                }
                
                console.log('✅ Successfully fetched modules:', data.length)
                console.log('✅ Modules data:', data)
                setAvailableModules(data)
            } catch (err: any) {
                console.error('❌ EXCEPTION in fetchModules:', err)
                alert(`⚠️ Exception loading modules: ${err?.message || err}`)
            }
        }

        fetchModules()
    }, [])

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
                    // Set default values if not found
                    setLocationCurrency({
                        currency_code: currency || 'USD',
                        ppp_multiplier: 1,
                        market_markup: 1,
                        tax_rate: 1
                    })
                } else {
                    console.log('Fetched location currency:', data)
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

    // Generate entity platform ID on mount
    useEffect(() => {
        async function generateEntityPlatformId() {
            if (entityPlatformId) return // Already has an ID

            try {
                const { data: platformIdData, error: platformIdError } = await supabase
                    .schema('master_data')
                    .rpc('generate_entity_platform_id')

                if (platformIdError) {
                    console.error('Error generating entity platform ID:', platformIdError)
                    return
                }

                setEntityPlatformId(platformIdData)
                console.log('Generated entity platform ID:', platformIdData)
            } catch (err) {
                console.error('Error generating entity platform ID:', err)
            }
        }

        generateEntityPlatformId()
    }, []) // Run once on mount

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!entityName.trim()) {
            setError('Entity name is required')
            return
        }

        if (!user?.id) {
            setError('You must be logged in to create an entity')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Verify we have a platform ID (should be auto-generated)
            if (!entityPlatformId) {
                setError('Entity Platform ID not generated. Please refresh the page.')
                setLoading(false)
                return
            }

            // Upload logo if provided
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
                        continue // Skip this file but continue with others
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
            const licensesArray = operatingLicenses.trim()
                ? operatingLicenses.split(',').map(s => s.trim()).filter(Boolean)
                : []
            
            const servicesObject = services.trim()
                ? JSON.parse(services)
                : {}

            const { error: insertError } = await supabase
                .from('hospitals')
                .insert([
                    {
                        entity_platform_id: entityPlatformId,
                        entity_name: entityName.trim(),
                        organization_platform_id: organizationPlatformId,
                        hospital_type: hospitalType.trim() || null,
                        currency: currency || null,
                        language: language || null,
                        
                        // Location
                        address: address.trim() || null,
                        city: city.trim() || null,
                        state: state.trim() || null,
                        post_code: postCode.trim() || null,
                        country: country.trim() || null,
                        
                        // Manager
                        manager_platform_id: managerPlatformId || null,
                        manager_first_name: managerFirstName.trim() || null,
                        manager_last_name: managerLastName.trim() || null,
                        manager_email_id: managerEmail.trim() || null,
                        manager_phone_number: managerPhone.trim() || null,
                        
                        // Capacity
                        total_beds: totalBeds ? parseInt(totalBeds) : null,
                        icu_beds: icuBeds ? parseInt(icuBeds) : null,
                        treatment_rooms: treatmentRooms ? parseInt(treatmentRooms) : null,
                        surgical_suites: surgicalSuites ? parseInt(surgicalSuites) : null,
                        
                        // Veterinary
                        chief_veterinarian_name: chiefVeterinarianName.trim() || null,
                        chief_veterinarian_contact: chiefVeterinarianContact.trim() || null,
                        veterinary_license_number: veterinaryLicenseNumber.trim() || null,
                        veterinary_license_expiry: veterinaryLicenseExpiry || null,
                        veterinary_specialties: null,
                        
                        // Additional
                        accreditation_details: accreditationDetails.trim() || null,
                        medical_equipment: null,
                        operating_licenses: licensesArray,
                        services: servicesObject,
                        
                        // Logo and License Storage
                        logo_storage: uploadedLogoPath ? {
                            url: supabase.storage.from('hospital-logos').getPublicUrl(uploadedLogoPath).data.publicUrl,
                            file_path: uploadedLogoPath,
                            storage_type: 'supabase'
                        } : null,
                        license_documents: uploadedLicenses.length > 0 ? uploadedLicenses : null,
                        
                        is_active: true,
                        created_by: user.id
                    }
                ])

            if (insertError) throw insertError

            router.push(`/organization/${organizationPlatformId}/entities`)
        } catch (err) {
            console.error('Error creating hospital:', err)
            setError(err instanceof Error ? err.message : 'Failed to create hospital')
        } finally {
            setLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-gray-600">Please log in to create a hospital</p>
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
                            <h1 className="text-3xl font-bold text-gray-800">Create New Hospital</h1>
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
                    {/* Logo Upload - At Top */}
                    <div className="pb-6 border-b border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Hospital Logo</label>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => logoInputRef.current?.click()}
                                className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-emerald-400 hover:bg-emerald-50"
                            >
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="mt-1 text-xs text-gray-500">Upload</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                            <div className="text-sm text-gray-600">
                                <p className="font-medium">Click to upload logo</p>
                                <p className="text-xs text-gray-500">PNG, JPG or WebP (max 2MB)</p>
                            </div>
                        </div>
                    </div>

                    {/* Hospital Information */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Hospital Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="entityPlatformId" className="block text-sm font-medium text-gray-700 mb-1">
                                    Hospital Platform ID
                                </label>
                                <input
                                    type="text"
                                    id="entityPlatformId"
                                    value={entityPlatformId}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                    disabled
                                    readOnly
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
                                <input
                                    type="text"
                                    id="hospitalType"
                                    value={hospitalType}
                                    onChange={(e) => setHospitalType(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="e.g., General, Specialty"
                                />
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
                                        Country
                                    </label>
                                    <CountrySelector
                                        value={country}
                                        onChange={async (countryCode) => {
                                            setCountry(countryCode)
                                            // Auto-populate currency and language based on country from location_currency table
                                            if (countryCode) {
                                                const defaultCurrency = await getCurrencyForCountry(countryCode)
                                                if (defaultCurrency) {
                                                    setCurrency(defaultCurrency)
                                                }
                                                
                                                const defaultLanguage = await getLanguageForCountry(countryCode)
                                                if (defaultLanguage) {
                                                    setLanguage(defaultLanguage)
                                                }
                                            }
                                        }}
                                        disabled={loading}
                                        placeholder="Select country..."
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
                                        placeholder="Select country first..."
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
                                <label htmlFor="services" className="block text-sm font-medium text-gray-700 mb-1">
                                    Services (JSON format)
                                </label>
                                <textarea
                                    id="services"
                                    value={services}
                                    onChange={(e) => setServices(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                                    placeholder='{"emergency": true, "boarding": false, "grooming": true}'
                                    rows={4}
                                />
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
                                <p className="text-xs text-yellow-600 mt-2">
                                    You may need to run GRANT permissions SQL in Supabase.
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
                                        {availableModules.map((module) => (
                                            <tr
                                                key={module.id}
                                                className={`cursor-pointer transition-colors ${
                                                    selectedModules.includes(module.id)
                                                        ? 'bg-emerald-50 hover:bg-emerald-100'
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
                                                    <div className="flex items-center">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {module.module_display_name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {module.module_name}
                                                            </div>
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
                                        ))}
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
                                    const monthlyTotal = selectedModulesData
                                        .filter(m => m.payment_frequency === 'monthly')
                                        .reduce((sum, m) => sum + calculateCustomerPrice(parseFloat(m.base_price)), 0)
                                    const oneTimeTotal = selectedModulesData
                                        .filter(m => m.payment_frequency !== 'monthly')
                                        .reduce((sum, m) => sum + calculateCustomerPrice(parseFloat(m.base_price)), 0)
                                    
                                    return (
                                        <div className="space-y-1">
                                            {monthlyTotal > 0 && (
                                                <p className="text-sm text-emerald-700">
                                                    Monthly Cost: <span className="font-bold">{getCurrencySymbol(currency)}{monthlyTotal.toFixed(2)}/month</span>
                                                </p>
                                            )}
                                            {oneTimeTotal > 0 && (
                                                <p className="text-sm text-emerald-700">
                                                    One-time Cost: <span className="font-bold">{getCurrencySymbol(currency)}{oneTimeTotal.toFixed(2)}</span>
                                                </p>
                                            )}
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
                            {loading ? 'Creating...' : 'Create Hospital'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
