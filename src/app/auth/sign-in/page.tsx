"use client"

import { FormEvent, Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@furfield/auth-service"

function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signIn } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setLoading(true)

        const result = await signIn(email, password)

        setLoading(false)

        if (result.error) {
            setError(result.error.message || 'Sign in failed')
            return
        }

        const redirectTo = searchParams.get("redirect") ?? "/organization"

        router.push(redirectTo)
        router.refresh()
    }

    return (
        <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-sky-100 px-4 py-16 text-slate-700">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,182,193,0.3),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(135,206,250,0.3),_transparent_50%)]" />

            <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-white/60 bg-white/80 p-10 shadow-2xl backdrop-blur">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Welcome back</h1>
                    <p className="text-sm text-slate-500">
                        Sign in with your Supabase credentials to access your workspace.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2 text-left">
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-200"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2 text-left">
                        <label htmlFor="password" className="text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-200"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>

                    {error ? (
                        <p className="text-sm font-medium text-rose-500" role="alert">
                            {error}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 px-3 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-sky-500 hover:via-sky-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500">
                    Need an account?{" "}
                    <Link
                        href="/auth/sign-up"
                        className="font-semibold text-sky-600 underline-offset-4 hover:text-sky-700 hover:underline"
                    >
                        Create one now
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function SignInPage() {
    return (
        <Suspense fallback={
            <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-sky-100 px-4 py-16 text-slate-700">
                <div className="text-center">Loading...</div>
            </div>
        }>
            <SignInForm />
        </Suspense>
    )
}
