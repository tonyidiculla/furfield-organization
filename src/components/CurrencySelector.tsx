'use client'

import { useCurrencies } from '@/hooks/useCurrencies'

interface CurrencySelectorProps {
    value: string // currency_code
    onChange: (currencyCode: string) => void
    disabled?: boolean
    required?: boolean
    className?: string
    placeholder?: string
    activeOnly?: boolean // Only show active currencies (default: true)
}

export default function CurrencySelector({
    value,
    onChange,
    disabled = false,
    required = false,
    className = '',
    placeholder = 'Select currency...',
    activeOnly = true
}: CurrencySelectorProps) {
    const { currencies, loading, error } = useCurrencies(activeOnly)

    if (loading) {
        return (
            <select
                disabled
                className={`w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 ${className}`}
            >
                <option>Loading currencies...</option>
            </select>
        )
    }

    if (error) {
        return (
            <div className="w-full">
                <select
                    disabled
                    className={`w-full px-3 py-2 border border-red-300 rounded-md bg-red-50 text-red-600 ${className}`}
                >
                    <option>Error loading currencies</option>
                </select>
                <p className="mt-1 text-sm text-red-600">{error}</p>
            </div>
        )
    }

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            required={required}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        >
            <option value="">{placeholder}</option>
            {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                    {currency.label}
                </option>
            ))}
        </select>
    )
}
