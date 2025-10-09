// Types for Location Currency data
export interface LocationCurrency {
    id: string
    currency_code: string // ISO 4217 code (e.g., 'USD', 'EUR', 'INR')
    currency_name: string // Full name (e.g., 'US Dollar')
    currency_symbol?: string // Symbol (e.g., '$', '€', '₹')
    country_code?: string // ISO 3166-1 alpha-2 country code
    country_name?: string // Country name
    is_active: boolean
    decimal_places: number // Number of decimal places (usually 2)
    display_format?: string // Format string like '$#,##0.00'
    created_at: string
    updated_at: string
}

// Helper type for currency selection dropdowns
export interface CurrencyOption {
    value: string // currency_code
    label: string // Display text: "USD - US Dollar ($)"
    symbol?: string
}
