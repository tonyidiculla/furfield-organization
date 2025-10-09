'use client'

import { useState } from 'react'
import { 
    validatePlatformId, 
    formatPlatformIdWithContext,
    parsePlatformId,
    isHumanPlatformId,
    isAnimalPlatformId,
    isCompanyPlatformId,
    isEntityPlatformId,
    getAnimalType,
    getCompanyType,
    getEntityType
} from '@/utils/platformId'
import PlatformIdHelper from '@/components/PlatformIdHelper'

export default function PlatformIdTestPage() {
    const [testId, setTestId] = useState('')
    const validation = testId ? validatePlatformId(testId) : null
    const parsed = testId ? parsePlatformId(testId) : null

    const testIds = {
        valid: [
            'H00000001',
            'A01000123',
            'A02000045',
            'C00000001',
            'C00000002',
            'E01000010',
            'E05000999'
        ],
        invalid: [
            'H0000001',
            'X00000001',
            'H99000001',
            'H00ABC001',
            '12345',
            ''
        ]
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-100 p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-slate-800">Platform ID Validation Test</h1>
                    <PlatformIdHelper />
                </div>

                {/* Live Test Input */}
                <div className="mb-8 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
                    <h2 className="mb-4 text-xl font-semibold text-slate-800">Live Validation Test</h2>
                    
                    <div className="mb-4">
                        <label htmlFor="testId" className="mb-2 block text-sm font-medium text-slate-700">
                            Enter Platform ID
                        </label>
                        <input
                            type="text"
                            id="testId"
                            value={testId}
                            onChange={(e) => setTestId(e.target.value)}
                            placeholder="e.g., H00000001"
                            className={`w-full rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 ${
                                validation && !validation.isValid
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500/20'
                            }`}
                        />
                    </div>

                    {/* Validation Results */}
                    {testId && (
                        <div className="space-y-4">
                            {/* Validation Status */}
                            <div className={`rounded-lg p-4 ${validation?.isValid ? 'bg-green-50' : 'bg-red-50'}`}>
                                <h3 className="mb-2 font-semibold text-slate-800">
                                    {validation?.isValid ? '✅ Valid Platform ID' : '❌ Invalid Platform ID'}
                                </h3>
                                {!validation?.isValid && validation?.error && (
                                    <p className="text-sm text-red-600">{validation.error}</p>
                                )}
                                {validation?.isValid && (
                                    <p className="text-sm text-green-600">{formatPlatformIdWithContext(testId)}</p>
                                )}
                            </div>

                            {/* Parsed Information */}
                            {parsed && (
                                <div className="rounded-lg bg-blue-50 p-4">
                                    <h3 className="mb-2 font-semibold text-slate-800">Parsed Information</h3>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-700">Full ID:</span>
                                            <span className="font-mono text-slate-900">{parsed.full}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-700">Category Code:</span>
                                            <span className="font-mono text-slate-900">{parsed.categoryCode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-700">Category Name:</span>
                                            <span className="text-slate-900">{parsed.categoryName || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-700">Type Code:</span>
                                            <span className="font-mono text-slate-900">{parsed.typeCode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-700">Type Name:</span>
                                            <span className="text-slate-900">{parsed.typeName || 'Unknown'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-medium text-slate-700">Sequential Number:</span>
                                            <span className="font-mono text-slate-900">{parsed.sequentialNumber}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Category Checks */}
                            {validation?.isValid && (
                                <div className="rounded-lg bg-purple-50 p-4">
                                    <h3 className="mb-2 font-semibold text-slate-800">Category Checks</h3>
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">Is Human?</span>
                                            <span>{isHumanPlatformId(testId) ? '✅ Yes' : '❌ No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">Is Animal?</span>
                                            <span>{isAnimalPlatformId(testId) ? '✅ Yes' : '❌ No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">Is Company?</span>
                                            <span>{isCompanyPlatformId(testId) ? '✅ Yes' : '❌ No'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-700">Is Entity?</span>
                                            <span>{isEntityPlatformId(testId) ? '✅ Yes' : '❌ No'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Specific Type Info */}
                                    {isAnimalPlatformId(testId) && (
                                        <div className="mt-2 border-t border-purple-200 pt-2">
                                            <span className="text-slate-700">Animal Type: </span>
                                            <span className="font-medium">{getAnimalType(testId)}</span>
                                        </div>
                                    )}
                                    {isCompanyPlatformId(testId) && (
                                        <div className="mt-2 border-t border-purple-200 pt-2">
                                            <span className="text-slate-700">Company Type: </span>
                                            <span className="font-medium">{getCompanyType(testId)}</span>
                                        </div>
                                    )}
                                    {isEntityPlatformId(testId) && (
                                        <div className="mt-2 border-t border-purple-200 pt-2">
                                            <span className="text-slate-700">Entity Type: </span>
                                            <span className="font-medium">{getEntityType(testId)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Test Buttons */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Valid IDs */}
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
                        <h2 className="mb-4 text-xl font-semibold text-green-700">✅ Valid Platform IDs</h2>
                        <div className="space-y-2">
                            {testIds.valid.map((id) => (
                                <button
                                    key={id}
                                    onClick={() => setTestId(id)}
                                    className="w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-left font-mono text-sm text-slate-800 transition hover:bg-green-100"
                                >
                                    {id}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Invalid IDs */}
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
                        <h2 className="mb-4 text-xl font-semibold text-red-700">❌ Invalid Platform IDs</h2>
                        <div className="space-y-2">
                            {testIds.invalid.map((id, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setTestId(id)}
                                    className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-left font-mono text-sm text-slate-800 transition hover:bg-red-100"
                                >
                                    {id || '(empty)'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Documentation */}
                <div className="mt-8 rounded-2xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
                    <h2 className="mb-4 text-xl font-semibold text-slate-800">Platform ID Format</h2>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-slate-50 p-4 font-mono">
                            <div className="text-2xl font-bold text-slate-800">H 00 000001</div>
                            <div className="mt-2 text-sm text-slate-600">
                                <div>↑ Category Code (1 char)</div>
                                <div className="ml-4">↑ Type Code (2 digits)</div>
                                <div className="ml-8">↑ Sequential Number (variable)</div>
                            </div>
                        </div>
                        
                        <div className="grid gap-4 text-sm md:grid-cols-4">
                            <div>
                                <div className="font-semibold text-slate-800">Human (H)</div>
                                <div className="text-slate-600">00: Default</div>
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">Animal (A)</div>
                                <div className="text-slate-600">01-06: Species</div>
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">Company (C)</div>
                                <div className="text-slate-600">00: Default</div>
                            </div>
                            <div>
                                <div className="font-semibold text-slate-800">Entity (E)</div>
                                <div className="text-slate-600">01-05: Type</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
