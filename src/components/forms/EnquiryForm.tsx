'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Send, CheckCircle, Phone, Loader2 } from 'lucide-react'
import { LIMAC, PRODUCT_CATEGORIES } from '@/lib/constants'
import type { EnquiryFormData } from '@/lib/types'

interface EnquiryFormProps {
  productName?: string
}

const ENQUIRY_FORM_DISABLED = true

export default function EnquiryForm({ productName }: EnquiryFormProps) {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EnquiryFormData>({
    defaultValues: {
      productInterest: productName ?? '',
    },
  })

  const onSubmit = async (data: EnquiryFormData) => {
    if (ENQUIRY_FORM_DISABLED) {
      setSubmitError('Online enquiry submission is temporarily disabled. Please contact us by WhatsApp or phone.')
      return
    }

    setIsLoading(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error ?? 'Submission failed')
      setIsSubmitted(true)
      reset()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="bg-gray-900 border border-limac-green/40 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-limac-green/10 border border-limac-green/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-limac-green" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Enquiry Received!</h3>
        <p className="text-limac-muted text-sm leading-relaxed mb-6">
          Thank you for reaching out. Our team will contact you within 24 hours.
          For urgent queries, WhatsApp us directly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`https://wa.me/${LIMAC.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bf5c] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Phone size={15} />
            WhatsApp Us
          </a>
          <button
            onClick={() => setIsSubmitted(false)}
            className="inline-flex items-center justify-center gap-2 border border-gray-700 text-limac-muted hover:text-white hover:border-gray-600 font-semibold px-5 py-2.5 rounded-lg text-sm transition-all"
          >
            Send Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-white font-bold text-xl mb-1">
        {productName ? `Enquire about ${productName}` : 'Send an Enquiry'}
      </h3>
      <p className="text-limac-muted text-sm mb-6">
        Online enquiry submission is temporarily disabled. Please contact us by WhatsApp or phone.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-limac-muted text-sm font-medium mb-1.5">
            Full Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Arun Kumar"
            className={`w-full bg-limac-black border text-white placeholder-gray-600 text-sm px-3 py-2.5 rounded-lg outline-none transition-colors ${
              errors.name
                ? 'border-red-500 focus:border-red-400'
                : 'border-gray-700 focus:border-limac-green'
            }`}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' },
            })}
          />
          {errors.name && (
            <p className="mt-1 text-red-400 text-xs">{errors.name.message}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-limac-muted text-sm font-medium mb-1.5">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            placeholder="e.g. +91 99958 11159"
            className={`w-full bg-limac-black border text-white placeholder-gray-600 text-sm px-3 py-2.5 rounded-lg outline-none transition-colors ${
              errors.phone
                ? 'border-red-500 focus:border-red-400'
                : 'border-gray-700 focus:border-limac-green'
            }`}
            {...register('phone', {
              required: 'Phone number is required',
              pattern: {
                value: /^[+\d\s-]{10,15}$/,
                message: 'Enter a valid phone number',
              },
            })}
          />
          {errors.phone && (
            <p className="mt-1 text-red-400 text-xs">{errors.phone.message}</p>
          )}
        </div>

        {/* Email (optional) */}
        <div>
          <label className="block text-limac-muted text-sm font-medium mb-1.5">
            Email Address <span className="text-gray-600 text-xs">(optional)</span>
          </label>
          <input
            type="email"
            placeholder="e.g. arun@example.com"
            className={`w-full bg-limac-black border text-white placeholder-gray-600 text-sm px-3 py-2.5 rounded-lg outline-none transition-colors ${
              errors.email
                ? 'border-red-500 focus:border-red-400'
                : 'border-gray-700 focus:border-limac-green'
            }`}
            {...register('email', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-red-400 text-xs">{errors.email.message}</p>
          )}
        </div>

        {/* Product interest */}
        <div>
          <label className="block text-limac-muted text-sm font-medium mb-1.5">
            Product Interest <span className="text-gray-600 text-xs">(optional)</span>
          </label>
          <select
            className="w-full bg-limac-black border border-gray-700 focus:border-limac-green text-white text-sm px-3 py-2.5 rounded-lg outline-none transition-colors"
            {...register('productInterest')}
          >
            <option value="">Select a category...</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.label}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div>
          <label className="block text-limac-muted text-sm font-medium mb-1.5">
            Message <span className="text-gray-600 text-xs">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Tell us about your requirements — battery voltage, capacity, application..."
            className="w-full bg-limac-black border border-gray-700 focus:border-limac-green text-white placeholder-gray-600 text-sm px-3 py-2.5 rounded-lg outline-none transition-colors resize-none"
            {...register('message')}
          />
        </div>

        {/* Error */}
        {submitError && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading || ENQUIRY_FORM_DISABLED}
          className="w-full inline-flex items-center justify-center gap-2 bg-limac-green hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed text-limac-black font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
        >
          {ENQUIRY_FORM_DISABLED ? (
            <>
              <Send size={18} />
              Enquiry Form Temporarily Disabled
            </>
          ) : isLoading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send size={18} />
              Send Enquiry
            </>
          )}
        </button>

        <p className="text-limac-muted text-xs text-center">
          Or WhatsApp us directly at{' '}
          <a
            href={`https://wa.me/${LIMAC.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-limac-green hover:underline"
          >
            {LIMAC.phone.primary}
          </a>
        </p>
      </form>
    </div>
  )
}
