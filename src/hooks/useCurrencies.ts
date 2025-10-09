import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { LocationCurrency, CurrencyOption } from '@/types/currency'

interface UseCurrenciesResult {
    currencies: CurrencyOption[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
}

/**
 * Custom hook to fetch and manage location currencies
 * @param activeOnly - If true, only fetches active currencies (default: true)
 * @returns Object containing currencies array, loading state, error, and refetch function
 */
export function useCurrencies(activeOnly: boolean = true): UseCurrenciesResult {
    const [currencies, setCurrencies] = useState<CurrencyOption[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCurrencies = async () => {
        try {
            setLoading(true)
            setError(null)

            let query = supabase
                .schema('master_data')
                .from('location_currency')
                .select('currency_code, currency_name, currency_symbol, country_name, country_code')
                .order('currency_name', { ascending: true })

            if (activeOnly) {
                query = query.eq('is_active', true)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            const options: CurrencyOption[] = (data as LocationCurrency[]).map(curr => ({
                value: curr.currency_code,
                label: `${curr.currency_code} - ${curr.currency_name}${curr.currency_symbol ? ` (${curr.currency_symbol})` : ''}`,
                symbol: curr.currency_symbol
            }))

            setCurrencies(options)
        } catch (err) {
            console.error('Error fetching currencies:', err)
            setError(err instanceof Error ? err.message : 'Failed to load currencies')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCurrencies()
    }, [activeOnly])

    return {
        currencies,
        loading,
        error,
        refetch: fetchCurrencies
    }
}

/**
 * Get a single currency by its code
 * @param currencyCode - The ISO 4217 currency code
 * @returns Promise resolving to the currency or null
 */
export async function getCurrencyByCode(currencyCode: string): Promise<LocationCurrency | null> {
    try {
        const { data, error } = await supabase
            .schema('master_data')
            .from('location_currency')
            .select('*')
            .eq('currency_code', currencyCode)
            .single()

        if (error) throw error
        return data as LocationCurrency
    } catch (err) {
        console.error('Error fetching currency:', err)
        return null
    }
}

/**
 * Get currencies for a specific country
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Promise resolving to array of currencies
 */
export async function getCurrenciesByCountry(countryCode: string): Promise<LocationCurrency[]> {
    try {
        const { data, error } = await supabase
            .schema('master_data')
            .from('location_currency')
            .select('*')
            .eq('country_code', countryCode)
            .eq('is_active', true)
            .order('currency_name', { ascending: true })

        if (error) throw error
        return data as LocationCurrency[]
    } catch (err) {
        console.error('Error fetching currencies by country:', err)
        return []
    }
}
