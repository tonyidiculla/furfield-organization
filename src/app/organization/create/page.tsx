'use client'

import { useEffect, useState, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@furfield/auth-service'
import type { Organization } from '@/types/organization'
import CurrencySelector from '@/components/CurrencySelector'
import CountrySelector from '@/components/CountrySelector'
import UserSearch from '@/components/UserSearch'
import { getCurrencyForCountry } from '@/hooks/useCountries'
import { 
    validatePlatformId, 
    getPlatformIdPlaceholder,
    isCompanyPlatformId,
    isEntityPlatformId,
    isHumanPlatformId 
} from '@/utils/platformId'

export default function CreateOrganizationPage() {
    const router = useRouter()
    const { user, loading: userLoading } = useUser()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const certificateInputRef = useRef<HTMLInputElement>(null)

    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    
    // Platform ID validation state
    const [platformIdErrors, setPlatformIdErrors] = useState<{
        organization_platform_id?: string
        owner_platform_id?: string
        manager_platform_id?: string
    }>({})
    
    const [formData, setFormData] = useState<Partial<Organization>>({
        organization_name: '',
        brand_name: '',
        organization_platform_id: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        notes: '',
        currency: '',
        language: 'English',
        owner_platform_id: '',
        owner_first_name: '',
        owner_last_name: '',
        owner_email: '',
        manager_platform_id: '',
        manager_first_name: '',
        manager_last_name: '',
        manager_email: '',
        manager_phone: '',
        business_registration_number: '',
        vat_gst_number: '',
        incorporation_date: '',
        business_type: '',
        primary_color: '#3b82f6',
        accent_color: '#8b5cf6',
        secondary_color: '#64748b',
        theme_preference: 'light',
        is_active: 'active'
    })

    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [certificateUrl, setCertificateUrl] = useState<string | null>(null)
    const [certificateFile, setCertificateFile] = useState<File | null>(null)
    
    // Store current user profile data
    const [currentUserProfile, setCurrentUserProfile] = useState<{
        user_id: string
        user_platform_id: string
        first_name: string
        last_name: string
        email: string
    } | null>(null)

    // Fetch current user profile
    useEffect(() => {
        async function fetchCurrentUserProfile() {
            if (!user?.id) return
            
            try {
                const { data, error } = await supabase
                    .schema('master_data')
                    .from('profiles')
                    .select('user_id, user_platform_id, first_name, last_name, email')
                    .eq('user_id', user.id)
                    .single()
                
                if (error) throw error
                setCurrentUserProfile(data)
            } catch (err) {
                console.error('Error fetching user profile:', err)
            }
        }
        
        fetchCurrentUserProfile()
    }, [user?.id])

    // Generate organization platform ID on mount
    useEffect(() => {
        async function generatePlatformId() {
            if (formData.organization_platform_id) return // Already has an ID
            
            try {
                const { data: platformIdData, error: platformIdError } = await supabase
                    .schema('master_data')
                    .rpc('generate_organization_platform_id')

                if (platformIdError) {
                    console.error('Error generating platform ID:', platformIdError)
                    return
                }

                setFormData(prev => ({
                    ...prev,
                    organization_platform_id: platformIdData
                }))
                console.log('Generated organization platform ID:', platformIdData)
            } catch (err) {
                console.error('Error generating platform ID:', err)
            }
        }
        
        generatePlatformId()
    }, []) // Run once on mount

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        
        // Debug business_type changes
        if (name === 'business_type') {
            console.log('business_type changed to:', value)
        }

        // Auto-prefix https:// for website field if not provided
        let finalValue = value
        if (name === 'website' && value && !value.match(/^https?:\/\//i)) {
            finalValue = 'https://' + value
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }))

        // Clear error when user starts typing
        if (error) setError(null)
        
        // Clear platform ID error when user modifies the field
        if (name === 'organization_platform_id' || name === 'owner_platform_id' || name === 'manager_platform_id') {
            setPlatformIdErrors(prev => ({
                ...prev,
                [name]: undefined
            }))
        }
    }

    const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file')
            return
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setError('Logo file size must be less than 2MB')
            return
        }

        setLogoFile(file)
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setLogoUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleCertificateUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type (PDF or images)
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        if (!validTypes.includes(file.type)) {
            setError('Please upload a PDF or image file (JPEG, PNG)')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Certificate file size must be less than 5MB')
            return
        }

        setCertificateFile(file)
        setCertificateUrl(file.name) // Just store the filename for display
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Validate platform IDs before submission (organization_platform_id is auto-generated)
        const errors: typeof platformIdErrors = {}
        
        if (formData.owner_platform_id) {
            const validation = validatePlatformId(formData.owner_platform_id)
            if (!validation.isValid) {
                errors.owner_platform_id = validation.error
            } else if (!isHumanPlatformId(formData.owner_platform_id)) {
                errors.owner_platform_id = 'Owner Platform ID must be a Human (H) type'
            }
        }
        
        if (formData.manager_platform_id) {
            const validation = validatePlatformId(formData.manager_platform_id)
            if (!validation.isValid) {
                errors.manager_platform_id = validation.error
            } else if (!isHumanPlatformId(formData.manager_platform_id)) {
                errors.manager_platform_id = 'Manager Platform ID must be a Human (H) type'
            }
        }
        
        if (Object.keys(errors).length > 0) {
            setPlatformIdErrors(errors)
            setError('Please fix the platform ID validation errors before submitting')
            return
        }

        try {
            setSaving(true)
            setError(null)
            setSuccess(null)

            console.log('Current formData.business_type:', formData.business_type)

            // Ensure we have an organization platform ID
            if (!formData.organization_platform_id) {
                setError('Organization Platform ID is required. Please refresh the page.')
                setSaving(false)
                return
            }

            // Upload logo if provided
            let uploadedLogoPath: string | null = null
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('organization-logos')
                    .upload(filePath, logoFile)

                if (uploadError) throw uploadError
                uploadedLogoPath = filePath
            }

            // Upload certificate if provided
            let uploadedCertificatePath: string | null = null
            if (certificateFile) {
                const fileExt = certificateFile.name.split('.').pop()
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('organization-certificates')
                    .upload(filePath, certificateFile)

                if (uploadError) throw uploadError
                uploadedCertificatePath = filePath
            }

            // Generate organization_id
            const organizationId = crypto.randomUUID()

            const insertData: any = {
                organization_id: organizationId,
                organization_name: formData.organization_name,
                brand_name: formData.brand_name || null,
                organization_platform_id: formData.organization_platform_id,
                manager_platform_id: formData.manager_platform_id || null,
                website: formData.website || null,
                email: formData.email || null,
                phone: formData.phone || null,
                address: formData.address || null,
                city: formData.city || null,
                state: formData.state || null,
                country: formData.country || null,
                postal_code: formData.postal_code || null,
                notes: formData.notes || null,
                currency: formData.currency || null,
                language: formData.language || null,
                owner_platform_id: formData.owner_platform_id || user?.user_metadata?.user_platform_id || null,
                owner_first_name: formData.owner_first_name || null,
                owner_last_name: formData.owner_last_name || null,
                owner_email: formData.owner_email || null,
                manager_first_name: formData.manager_first_name || null,
                manager_last_name: formData.manager_last_name || null,
                manager_email: formData.manager_email || null,
                manager_phone: formData.manager_phone || null,
                business_registration_number: formData.business_registration_number || null,
                vat_gst_number: formData.vat_gst_number || null,
                incorporation_date: formData.incorporation_date || null,
                business_type: formData.business_type || null,
                primary_color: formData.primary_color || '#3b82f6',
                accent_color: formData.accent_color || '#8b5cf6',
                secondary_color: formData.secondary_color || '#64748b',
                theme_preference: formData.theme_preference || 'light',
                is_active: formData.is_active,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            // Add logo storage if uploaded
            if (uploadedLogoPath) {
                const { data: { publicUrl } } = supabase.storage
                    .from('organization-logos')
                    .getPublicUrl(uploadedLogoPath)

                insertData.logo_storage = {
                    url: publicUrl,
                    file_path: uploadedLogoPath,
                    storage_type: 'supabase'
                }
            }

            // Add certificate URL if uploaded
            if (uploadedCertificatePath) {
                insertData.certificate_of_incorporation_url = uploadedCertificatePath
            }

            console.log('Creating organization with data:', insertData)
            console.log('business_type value:', formData.business_type, 'will be sent as:', insertData.business_type)
            
            const { data: createdData, error: insertError } = await supabase
                .schema('master_data')
                .from('organizations')
                .insert([insertData])
                .select()

            if (insertError) {
                console.error('Supabase insert error:', insertError)
                throw insertError
            }

            console.log('Organization created successfully:', createdData)
            setSuccess('Organization created successfully!')
            
            // Redirect to the created organization's edit page after a short delay
            setTimeout(() => {
                if (createdData && createdData[0]) {
                    router.push(`/organization/${createdData[0].organization_id}/edit`)
                } else {
                    router.push('/organizations')
                }
            }, 1500)
        } catch (err) {
            console.error('Error creating organization:', err)
            console.error('Error details:', JSON.stringify(err, null, 2))
            setError(err instanceof Error ? err.message : 'Failed to create organization')
        } finally {
            setSaving(false)
        }
    }

    if (userLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-sky-500"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600">Please log in to create an organization.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-100 px-6 py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(186,230,253,0.35),_transparent_55%),_radial-gradient(circle_at_bottom_right,_rgba(167,243,208,0.35),_transparent_45%)]" />

            <div className="relative mx-auto w-full max-w-4xl">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-800">Create New Organization</h1>
                    <button
                        onClick={() => router.push('/organization')}
                        className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
                    >
                        ← Back
                    </button>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-6 py-4">
                        <p className="text-sm text-red-700">❌ {error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-6 py-4">
                        <p className="text-sm text-green-700">✅ {success}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-2xl backdrop-blur">
                    {/* Logo Section */}
                    <div className="mb-8">
                        <label className="mb-2 block text-sm font-medium text-slate-700">Organization Logo</label>
                        <div className="flex items-center gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-sky-400 hover:bg-sky-50"
                            >
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <svg className="mx-auto h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="mt-1 text-xs text-slate-500">Upload</span>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={handleLogoUpload}
                                disabled={uploading}
                            />
                            <div className="text-sm text-slate-600">
                                <p className="font-medium">Click to upload logo</p>
                                <p className="text-xs text-slate-500">PNG, JPG or WebP (max 2MB)</p>
                            </div>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="mb-6">
                        <h2 className="mb-4 text-xl font-semibold text-slate-800">Basic Information</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="organization_name" className="mb-2 block text-sm font-medium text-slate-700">
                                        Organization Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="organization_name"
                                        name="organization_name"
                                        value={formData.organization_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="brand_name" className="mb-2 block text-sm font-medium text-slate-700">
                                        Brand Name
                                    </label>
                                    <input
                                        type="text"
                                        id="brand_name"
                                        name="brand_name"
                                        value={formData.brand_name}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="website" className="mb-2 block text-sm font-medium text-slate-700">
                                        Website
                                    </label>
                                    <input
                                        type="text"
                                        id="website"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        placeholder="example.com"
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">https:// will be added automatically</p>
                                </div>

                                <div>
                                    <label htmlFor="is_active" className="mb-2 block text-sm font-medium text-slate-700">
                                        Status
                                    </label>
                                    <select
                                        id="is_active"
                                        name="is_active"
                                        value={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="organization_platform_id" className="mb-2 block text-sm font-medium text-slate-700">
                                        Organization Platform ID
                                    </label>
                                    <input
                                        type="text"
                                        id="organization_platform_id"
                                        name="organization_platform_id"
                                        value={formData.organization_platform_id || 'Generating...'}
                                        readOnly
                                        className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="mb-6">
                            <h2 className="mb-4 text-xl font-semibold text-slate-800">Contact Information</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="email" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                        </svg>
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                                        </svg>
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Owner Information */}
                        <div className="mb-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-800">Owner Information</h2>
                                {currentUserProfile && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.owner_user_id === currentUserProfile.user_id}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        owner_user_id: currentUserProfile.user_id,
                                                        owner_platform_id: currentUserProfile.user_platform_id,
                                                        owner_first_name: currentUserProfile.first_name,
                                                        owner_last_name: currentUserProfile.last_name,
                                                        owner_email: currentUserProfile.email
                                                    }))
                                                } else {
                                                    // Clear owner fields when unchecked
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        owner_user_id: '',
                                                        owner_platform_id: '',
                                                        owner_first_name: '',
                                                        owner_last_name: '',
                                                        owner_email: ''
                                                    }))
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-500/20"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Assign myself as owner</span>
                                    </label>
                                )}
                            </div>
                            <div className="grid gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Search for Owner
                                    </label>
                                    <UserSearch
                                        onSelect={(selectedUser) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                owner_user_id: selectedUser.user_id,
                                                owner_platform_id: selectedUser.user_platform_id,
                                                owner_first_name: selectedUser.first_name,
                                                owner_last_name: selectedUser.last_name,
                                                owner_email: selectedUser.email
                                            }))
                                        }}
                                        placeholder="Search by name, email, or platform ID..."
                                        selectedUserId={formData.owner_user_id}
                                    />
                                    {platformIdErrors.owner_platform_id && (
                                        <p className="mt-1 text-sm text-red-600">{platformIdErrors.owner_platform_id}</p>
                                    )}
                                </div>
                                
                                {/* Display selected owner details */}
                                {formData.owner_first_name && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <h3 className="mb-2 text-sm font-medium text-slate-700">Selected Owner</h3>
                                        <div className="grid gap-2 text-sm">
                                            <div><span className="font-medium">Name:</span> {formData.owner_first_name} {formData.owner_last_name}</div>
                                            <div><span className="font-medium">Email:</span> {formData.owner_email}</div>
                                            <div><span className="font-medium">Platform ID:</span> {formData.owner_platform_id}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Manager Information */}
                        <div className="mb-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-slate-800">Manager Information</h2>
                                {currentUserProfile && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.manager_id === currentUserProfile.user_id}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        manager_id: currentUserProfile.user_id,
                                                        manager_platform_id: currentUserProfile.user_platform_id,
                                                        manager_first_name: currentUserProfile.first_name,
                                                        manager_last_name: currentUserProfile.last_name,
                                                        manager_email: currentUserProfile.email,
                                                        manager_phone: '' // Keep existing phone or empty
                                                    }))
                                                } else {
                                                    // Clear manager fields when unchecked
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        manager_id: '',
                                                        manager_platform_id: '',
                                                        manager_first_name: '',
                                                        manager_last_name: '',
                                                        manager_email: '',
                                                        manager_phone: ''
                                                    }))
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-2 focus:ring-sky-500/20"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Assign myself as manager</span>
                                    </label>
                                )}
                            </div>
                            <div className="grid gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Search for Manager
                                    </label>
                                    <UserSearch
                                        onSelect={(selectedUser) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                manager_id: selectedUser.user_id,
                                                manager_platform_id: selectedUser.user_platform_id,
                                                manager_first_name: selectedUser.first_name,
                                                manager_last_name: selectedUser.last_name,
                                                manager_email: selectedUser.email
                                            }))
                                        }}
                                        placeholder="Search by name, email, or platform ID..."
                                        selectedUserId={formData.manager_id}
                                    />
                                    {platformIdErrors.manager_platform_id && (
                                        <p className="mt-1 text-sm text-red-600">{platformIdErrors.manager_platform_id}</p>
                                    )}
                                </div>
                                
                                {/* Display selected manager details */}
                                {formData.manager_first_name && (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                        <h3 className="mb-2 text-sm font-medium text-slate-700">Selected Manager</h3>
                                        <div className="grid gap-2 text-sm">
                                            <div><span className="font-medium">Name:</span> {formData.manager_first_name} {formData.manager_last_name}</div>
                                            <div><span className="font-medium">Email:</span> {formData.manager_email}</div>
                                            <div>
                                                <span className="font-medium">Platform ID:</span> {formData.manager_platform_id}
                                            </div>
                                        </div>
                                        
                                        {/* Optional: Add phone field for manager */}
                                        <div className="mt-3">
                                            <label htmlFor="manager_phone" className="mb-1 block text-xs font-medium text-slate-600">
                                                Manager Phone (Optional)
                                            </label>
                                            <input
                                                type="tel"
                                                id="manager_phone"
                                                name="manager_phone"
                                                value={formData.manager_phone}
                                                onChange={handleInputChange}
                                                placeholder="+1 (555) 000-0000"
                                                className="w-full rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="mb-6">
                            <h2 className="mb-4 text-xl font-semibold text-slate-800">Address Information</h2>
                            <div className="grid gap-4">
                                <div>
                                    <label htmlFor="address" className="mb-2 block text-sm font-medium text-slate-700">
                                        Street Address
                                    </label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="city" className="mb-2 block text-sm font-medium text-slate-700">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            id="city"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="state" className="mb-2 block text-sm font-medium text-slate-700">
                                            State/Province
                                        </label>
                                        <input
                                            type="text"
                                            id="state"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="country" className="mb-2 block text-sm font-medium text-slate-700">
                                            Country
                                        </label>
                                        <CountrySelector
                                            value={formData.country || ''}
                                            onChange={async (countryCode) => {
                                                setFormData(prev => ({ ...prev, country: countryCode }))
                                                // Auto-populate currency based on country
                                                if (countryCode) {
                                                    const currency = await getCurrencyForCountry(countryCode)
                                                    if (currency) {
                                                        setFormData(prev => ({ ...prev, currency }))
                                                    }
                                                }
                                            }}
                                            disabled={saving}
                                            placeholder="Select country..."
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="postal_code" className="mb-2 block text-sm font-medium text-slate-700">
                                            Postal Code
                                        </label>
                                        <input
                                            type="text"
                                            id="postal_code"
                                            name="postal_code"
                                            value={formData.postal_code}
                                            onChange={handleInputChange}
                                            className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Business Registration */}
                        <div className="mb-6">
                            <h2 className="mb-4 text-xl font-semibold text-slate-800">Business Registration</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="business_registration_number" className="mb-2 block text-sm font-medium text-slate-700">
                                        Business Registration Number
                                    </label>
                                    <input
                                        type="text"
                                        id="business_registration_number"
                                        name="business_registration_number"
                                        value={formData.business_registration_number}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="vat_gst_number" className="mb-2 block text-sm font-medium text-slate-700">
                                        VAT/GST Number
                                    </label>
                                    <input
                                        type="text"
                                        id="vat_gst_number"
                                        name="vat_gst_number"
                                        value={formData.vat_gst_number}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="incorporation_date" className="mb-2 block text-sm font-medium text-slate-700">
                                        Incorporation Date
                                    </label>
                                    <input
                                        type="date"
                                        id="incorporation_date"
                                        name="incorporation_date"
                                        value={formData.incorporation_date}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="business_type" className="mb-2 block text-sm font-medium text-slate-700">
                                        Business Type
                                    </label>
                                    <select
                                        id="business_type"
                                        name="business_type"
                                        value={formData.business_type}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    >
                                        <option value="">Select type...</option>
                                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                                        <option value="Partnership">Partnership</option>
                                        <option value="Private Limited">Private Limited</option>
                                        <option value="Public Limited">Public Limited</option>
                                        <option value="LLC">LLC</option>
                                        <option value="Corporation">Corporation</option>
                                        <option value="Non-Profit">Non-Profit</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="certificate" className="mb-2 block text-sm font-medium text-slate-700">
                                        Certificate of Incorporation
                                    </label>
                                    <input
                                        ref={certificateInputRef}
                                        type="file"
                                        id="certificate"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleCertificateUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => certificateInputRef.current?.click()}
                                        className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        {certificateUrl ? 'Change Certificate' : 'Upload Certificate'}
                                    </button>
                                    {certificateUrl && (
                                        <p className="mt-2 text-sm text-green-600">✓ {certificateUrl}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Currency & Language */}
                        <div className="mb-6">
                            <h2 className="mb-4 text-xl font-semibold text-slate-800">Localization</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label htmlFor="currency" className="mb-2 block text-sm font-medium text-slate-700">
                                        Currency
                                    </label>
                                    <CurrencySelector
                                        value={formData.currency || ''}
                                        onChange={(currency) => setFormData(prev => ({ ...prev, currency }))}
                                        disabled={saving}
                                        placeholder="Select currency..."
                                    />
                                </div>

                                <div>
                                    <label htmlFor="language" className="mb-2 block text-sm font-medium text-slate-700">
                                        Language
                                    </label>
                                    <select
                                        id="language"
                                        name="language"
                                        value={formData.language || 'English'}
                                        onChange={handleInputChange}
                                        disabled={saving}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    >
                                        <option value="English">English</option>
                                    </select>
                                    {/* Language helper removed for cleaner UI */}
                                </div>
                            </div>
                        </div>

                        {/* Branding Colors */}
                        <div className="mb-6">
                            <h2 className="mb-4 text-xl font-semibold text-slate-800">Branding</h2>
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <label htmlFor="primary_color" className="mb-2 block text-sm font-medium text-slate-700">
                                            Primary Color
                                        </label>
                                        <input
                                            type="color"
                                            id="primary_color"
                                            name="primary_color"
                                            value={formData.primary_color}
                                            onChange={handleInputChange}
                                            className="h-10 w-full rounded-lg border border-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="accent_color" className="mb-2 block text-sm font-medium text-slate-700">
                                            Accent Color
                                        </label>
                                        <input
                                            type="color"
                                            id="accent_color"
                                            name="accent_color"
                                            value={formData.accent_color}
                                            onChange={handleInputChange}
                                            className="h-10 w-full rounded-lg border border-slate-300"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="secondary_color" className="mb-2 block text-sm font-medium text-slate-700">
                                            Secondary Color
                                        </label>
                                        <input
                                            type="color"
                                            id="secondary_color"
                                            name="secondary_color"
                                            value={formData.secondary_color}
                                            onChange={handleInputChange}
                                            className="h-10 w-full rounded-lg border border-slate-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="theme_preference" className="mb-2 block text-sm font-medium text-slate-700">
                                        Theme Preference
                                    </label>
                                    <select
                                        id="theme_preference"
                                        name="theme_preference"
                                        value={formData.theme_preference}
                                        onChange={handleInputChange}
                                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                    >
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mb-6">
                            <label htmlFor="notes" className="mb-2 block text-sm font-medium text-slate-700">
                                Notes
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                                placeholder="Additional notes about this organization..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Organization
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.back()}
                                disabled={saving}
                                className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
        </div>
    )
}
