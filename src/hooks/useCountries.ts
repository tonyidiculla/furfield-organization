'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface CountryOption {
    value: string // country_code
    label: string // country_name
}

interface UseCountriesReturn {
    countries: CountryOption[]
    loading: boolean
    error: string | null
}

/**
 * Hook to fetch and manage country data from location_currency table
 * Returns distinct countries with their codes
 */
export function useCountries(): UseCountriesReturn {
    const [countries, setCountries] = useState<CountryOption[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchCountries() {
            try {
                setLoading(true)
                setError(null)

                const { data, error: fetchError } = await supabase
                    .schema('master_data')
                    .from('location_currency')
                    .select('country_code, country_name')
                    .not('country_code', 'is', null)
                    .not('country_name', 'is', null)
                    .order('country_name', { ascending: true })

                if (fetchError) throw fetchError

                // Get distinct countries
                const uniqueCountries = Array.from(
                    new Map(
                        data.map(item => [item.country_code, item])
                    ).values()
                )

                const options: CountryOption[] = uniqueCountries.map(country => ({
                    value: country.country_code,
                    label: country.country_name
                }))

                setCountries(options)
            } catch (err) {
                console.error('Error fetching countries:', err)
                setError(err instanceof Error ? err.message : 'Failed to load countries')
            } finally {
                setLoading(false)
            }
        }

        fetchCountries()
    }, [])

    return { countries, loading, error }
}

/**
 * Get country name by country code
 */
export async function getCountryByCode(countryCode: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .schema('master_data')
            .from('location_currency')
            .select('country_name')
            .eq('country_code', countryCode)
            .limit(1)
            .single()

        if (error) throw error
        return data?.country_name || null
    } catch (err) {
        console.error('Error fetching country:', err)
        return null
    }
}

/**
 * Get currency for a specific country
 */
export async function getCurrencyForCountry(countryCode: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .schema('master_data')
            .from('location_currency')
            .select('currency_code')
            .eq('country_code', countryCode)
            .eq('is_active', true)
            .limit(1)
            .single()

        if (error) throw error
        return data?.currency_code || null
    } catch (err) {
        console.error('Error fetching currency for country:', err)
        return null
    }
}

/**
 * Get language for a specific country
 */
export async function getLanguageForCountry(countryCode: string): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .schema('master_data')
            .from('location_currency')
            .select('language_name')
            .eq('country_code', countryCode)
            .eq('is_active', true)
            .limit(1)
            .single()

        if (error) throw error
        return data?.language_name || null
    } catch (err) {
        console.error('Error fetching language for country:', err)
        return null
    }
}
