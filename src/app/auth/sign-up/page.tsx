"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"

import { supabase } from "@/lib/supabase"

export default function SignUpPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setMessage(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }

        setLoading(true)

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        })

        setLoading(false)

        if (signUpError) {
            setError(signUpError.message)
            return
        }

        setMessage(
            "Check your inbox for a confirmation email. Once confirmed, you can sign in with your new account."
        )
        setEmail("")
        setPassword("")
        setConfirmPassword("")
    }

    return (
        <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-rose-50 via-white to-amber-100 px-4 py-16 text-slate-700">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,183,77,0.25),_transparent_55%),_radial-gradient(circle_at_bottom,_rgba(147,197,253,0.35),_transparent_45%)]" />

            <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-white/60 bg-white/80 p-10 shadow-2xl backdrop-blur">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Create an account</h1>
                    <p className="text-sm text-slate-500">
                        Connect with Supabase auth to access your organization workspace.
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
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200"
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
                            autoComplete="new-password"
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2 text-left">
                        <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">
                            Confirm password
                        </label>
                        <input
                            id="confirm-password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={6}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                    </div>

                    {error ? (
                        <p className="text-sm font-medium text-rose-500" role="alert">
                            {error}
                        </p>
                    ) : null}

                    {message ? (
                        <p className="text-sm font-medium text-emerald-500" role="status">
                            {message}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-rose-400 px-3 py-2.5 text-sm font-semibold text-slate-800 shadow-lg transition hover:from-amber-400 hover:via-amber-500 hover:to-rose-500 focus:outline-none focus:ring-4 focus:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? "Creating account…" : "Create account"}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500">
                    Already have an account?{" "}
                    <Link
                        href="/auth/sign-in"
                        className="font-semibold text-amber-600 underline-offset-4 hover:text-amber-700 hover:underline"
                    >
                        Sign in instead
                    </Link>
                </p>
            </div>
        </div>
    )
}
