'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { AlertCircle, LockKeyhole, Loader2, LogIn, Mail } from 'lucide-react'
import { loginWarrantyAdmin } from '@/services/warrantyApi'
import { withBasePath } from '@/lib/basePath'
import { saveAdminSession } from '@/components/warranty/adminSession'

export default function AdminLoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Enter your admin email and password.')
      return
    }

    setLoading(true)
    try {
      const result = await loginWarrantyAdmin({ email, password })
      saveAdminSession(result.access_token, result.role)
      window.location.href = '/admin/warranty/registrations'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-24 lg:grid-cols-[1fr_420px]">
      <div className="hidden lg:block">
        <Image
          src={withBasePath('/logo-header-dark.webp')}
          alt="Limac Power Tech"
          width={1412}
          height={424}
          className="h-auto w-64"
          priority
        />
        <h1 className="mt-10 max-w-xl text-4xl font-bold leading-tight text-white">
          Warranty review console
        </h1>
        <p className="mt-4 max-w-lg text-limac-muted">
          Review customer submissions, inspect advisory serial validation and approve eligible
          warranty registrations.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="rounded-lg border border-gray-800 bg-gray-900 p-6 shadow-xl shadow-black/20 sm:p-8"
      >
        <div className="lg:hidden">
          <Image
            src={withBasePath('/logo-header-dark.webp')}
            alt="Limac Power Tech"
            width={1412}
            height={424}
            className="h-auto w-44"
            priority
          />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase text-limac-green lg:mt-0">
          Admin access
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">Sign in to warranty admin</h2>

        {error ? (
          <div className="mt-5 flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <label>
            <span className="mb-1.5 block text-sm font-semibold text-white">Email</span>
            <span className="flex items-center gap-2 rounded-lg border border-gray-700 bg-limac-black px-3 py-3 transition focus-within:border-limac-green">
              <Mail size={16} className="text-limac-muted" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </span>
          </label>

          <label>
            <span className="mb-1.5 block text-sm font-semibold text-white">Password</span>
            <span className="flex items-center gap-2 rounded-lg border border-gray-700 bg-limac-black px-3 py-3 transition focus-within:border-limac-green">
              <LockKeyhole size={16} className="text-limac-muted" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-sm text-white outline-none"
              />
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
