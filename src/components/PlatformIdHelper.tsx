'use client'

import { useState } from 'react'
import { PLATFORM_ID_TYPES, getExamplePlatformIds } from '@/utils/platformId'

export default function PlatformIdHelper() {
    const [isOpen, setIsOpen] = useState(false)
    const examples = getExamplePlatformIds()

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Platform ID Guide
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 w-[600px] rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
                    <div className="mb-4 flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-slate-800">Platform ID Format Guide</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-4 rounded-lg bg-blue-50 p-4">
                        <p className="text-sm text-slate-700">
                            <strong>Format:</strong> [Category Code][Type Code][Sequential Number]
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                            Example: <code className="rounded bg-white px-2 py-1 font-mono text-blue-600">H00000001</code>
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            <li>• <strong>H</strong> = Human (Category Code)</li>
                            <li>• <strong>00</strong> = Default (Type Code)</li>
                            <li>• <strong>000001</strong> = Sequential ID</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        {/* Human Category */}
                        <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                {PLATFORM_ID_TYPES.HUMAN.name} ({PLATFORM_ID_TYPES.HUMAN.code})
                            </h4>
                            <ul className="space-y-1 text-sm text-slate-600">
                                {examples.Human.map((example, idx) => (
                                    <li key={idx} className="font-mono text-xs">
                                        {example}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Animal Category */}
                        <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                {PLATFORM_ID_TYPES.ANIMAL.name} ({PLATFORM_ID_TYPES.ANIMAL.code})
                            </h4>
                            <ul className="space-y-1 text-sm text-slate-600">
                                {examples.Animal.map((example, idx) => (
                                    <li key={idx} className="font-mono text-xs">
                                        {example}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company Category */}
                        <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                {PLATFORM_ID_TYPES.COMPANY.name} ({PLATFORM_ID_TYPES.COMPANY.code})
                            </h4>
                            <ul className="space-y-1 text-sm text-slate-600">
                                {examples.Company.map((example, idx) => (
                                    <li key={idx} className="font-mono text-xs">
                                        {example}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Entity Category */}
                        <div>
                            <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                {PLATFORM_ID_TYPES.ENTITY.name} ({PLATFORM_ID_TYPES.ENTITY.code})
                            </h4>
                            <ul className="space-y-1 text-sm text-slate-600">
                                {examples.Entity.map((example, idx) => (
                                    <li key={idx} className="font-mono text-xs">
                                        {example}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4">
                        <p className="text-xs text-slate-500">
                            <strong>Note:</strong> Platform IDs are unique identifiers that categorize entities in the system. 
                            Each ID starts with a category code (H, A, C, E), followed by a 2-digit type code, 
                            and ends with a variable-length sequential number.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
