'use client'

import { useCountries } from '@/hooks/useCountries'

interface CountrySelectorProps {
    value: string // country_code (e.g., 'US', 'IN', 'GB')
    onChange: (countryCode: string) => void
    onCountryChange?: (countryCode: string, countryName: string) => void // Optional callback with both code and name
    disabled?: boolean
    required?: boolean
    className?: string
    placeholder?: string
}

export default function CountrySelector({
    value,
    onChange,
    onCountryChange,
    disabled = false,
    required = false,
    className = '',
    placeholder = 'Select country...'
}: CountrySelectorProps) {
    const { countries, loading, error } = useCountries()

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCode = e.target.value
        onChange(selectedCode)
        
        // If callback provided, also send the country name
        if (onCountryChange && selectedCode) {
            const country = countries.find(c => c.value === selectedCode)
            if (country) {
                onCountryChange(selectedCode, country.label)
            }
        }
    }

    if (loading) {
        return (
            <select
                disabled
                className={`w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-slate-500 ${className}`}
            >
                <option>Loading countries...</option>
            </select>
        )
    }

    if (error) {
        return (
            <div className="w-full">
                <select
                    disabled
                    className={`w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-red-600 ${className}`}
                >
                    <option>Error loading countries</option>
                </select>
                <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
        )
    }

    return (
        <select
            value={value}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            className={`w-full rounded-lg border border-slate-300 px-4 py-2 shadow-sm transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 ${className}`}
        >
            <option value="">{placeholder}</option>
            {countries.map((country) => (
                <option key={country.value} value={country.value}>
                    {country.label}
                </option>
            ))}
        </select>
    )
}
