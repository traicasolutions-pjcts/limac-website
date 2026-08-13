'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, Check, ChevronLeft, ChevronRight, FileUp, Loader2 } from 'lucide-react'
import Badge from '@/components/common/Badge'
import { createWarrantyRegistration, uploadWarrantyBill } from '@/services/warrantyApi'
import type { WarrantyRegistrationPayload } from '@/types/warranty'
import { maskMobile, maskSerial, validateBillFile } from '@/validation/warranty'

const emptyForm = {
  name: '',
  addressLine: '',
  city: '',
  state: 'Kerala',
  pinCode: '',
  mobileNumber: '',
  serialNumber: '',
  productModel: '',
  purchaseDate: '',
  invoiceNumber: '',
  dealerName: '',
  dealerCode: '',
  warrantyTermsConsent: false,
  privacyPolicyConsent: false,
}

export default function WarrantyRegisterClient() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyForm)
  const [bill, setBill] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const billError = useMemo(() => validateBillFile(bill), [bill])

  function updateField(field: keyof typeof emptyForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function canReview() {
    return (
      form.name &&
      form.addressLine &&
      form.city &&
      form.state &&
      form.pinCode &&
      form.mobileNumber &&
      form.serialNumber &&
      form.purchaseDate &&
      form.invoiceNumber &&
      form.dealerName &&
      !billError
    )
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const formError = validateForm()
    if (formError) {
      setError(formError)
      return
    }
    if (!form.warrantyTermsConsent || !form.privacyPolicyConsent) {
      setError('Accept the warranty terms and privacy policy to continue.')
      return
    }
    if (billError) {
      setError(billError)
      return
    }

    const payload: WarrantyRegistrationPayload = {
      customer: {
        name: form.name,
        address_line: form.addressLine,
        city: form.city,
        state: form.state,
        pin_code: form.pinCode,
        mobile_number: form.mobileNumber,
      },
      serial_number: form.serialNumber,
      product_model: form.productModel || undefined,
      purchase: {
        purchase_date: form.purchaseDate,
        invoice_number: form.invoiceNumber,
        dealer_name: form.dealerName,
        dealer_code: form.dealerCode || undefined,
      },
      warranty_terms_consent: form.warrantyTermsConsent,
      privacy_policy_consent: form.privacyPolicyConsent,
      turnstile_token: 'local-placeholder',
    }

    setLoading(true)
    try {
      const result = await createWarrantyRegistration(payload, crypto.randomUUID())
      if (bill) {
        try {
          await uploadWarrantyBill(result.registration_number, bill)
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error
              ? `Registration was created as ${result.registration_number}, but bill upload failed: ${uploadError.message}`
              : `Registration was created as ${result.registration_number}, but bill upload failed.`
          )
        }
      }
      window.sessionStorage.setItem('limacWarrantyLastReference', result.registration_number)
      router.push(`/warranty/submitted?reference=${encodeURIComponent(result.registration_number)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Your entered details are preserved.')
    } finally {
      setLoading(false)
    }
  }

  function validateForm() {
    if (form.addressLine.trim().length < 5) return 'Address line must have at least 5 characters.'
    if (!/^\d{6}$/.test(form.pinCode.trim())) return 'PIN code must be exactly 6 digits.'
    if (form.invoiceNumber.trim().length < 1) return 'Invoice or bill number is required.'
    if (form.dealerName.trim().length < 2) return 'Dealer or shop name must have at least 2 characters.'
    return null
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="flex items-center gap-3 text-sm">
        <Badge variant={step === 1 ? 'green' : 'muted'}>1 Customer and purchase</Badge>
        <Badge variant={step === 2 ? 'green' : 'muted'}>2 Review</Badge>
      </div>

      {error ? (
        <div className="flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Name"
            required
            hint="Enter the customer name as shown on the invoice."
            value={form.name}
            onChange={(value) => updateField('name', value)}
          />
          <Input
            label="Mobile number"
            required
            hint="Use the mobile number to check registration status later."
            value={form.mobileNumber}
            onChange={(value) => updateField('mobileNumber', value)}
          />
          <Input
            label="Address line"
            required
            hint="House name/number, street or locality."
            value={form.addressLine}
            onChange={(value) => updateField('addressLine', value)}
            className="md:col-span-2"
          />
          <Input
            label="City"
            required
            hint="Enter your city or town."
            value={form.city}
            onChange={(value) => updateField('city', value)}
          />
          <Input
            label="State"
            required
            hint="Enter the state from the billing address."
            value={form.state}
            onChange={(value) => updateField('state', value)}
          />
          <Input
            label="PIN code"
            required
            hint="Enter a 6-digit Indian PIN code."
            value={form.pinCode}
            onChange={(value) => updateField('pinCode', value)}
          />
          <div className="space-y-2">
            <Input
              label="Product serial number"
              required
              hint="Enter the serial number printed on the product label."
              value={form.serialNumber}
              onChange={(value) => updateField('serialNumber', value)}
            />
          </div>
          <Input
            label="Product model"
            hint="Optional if you are unsure; Limac admin will verify it."
            value={form.productModel}
            onChange={(value) => updateField('productModel', value)}
          />
          <Input
            label="Purchase date"
            required
            hint="Select the purchase date shown on the bill."
            type="date"
            value={form.purchaseDate}
            onChange={(value) => updateField('purchaseDate', value)}
          />
          <Input
            label="Invoice or bill number"
            required
            hint="Enter the invoice/bill number exactly as printed."
            value={form.invoiceNumber}
            onChange={(value) => updateField('invoiceNumber', value)}
          />
          <Input
            label="Dealer or shop name"
            required
            hint="Enter the shop, dealer or seller name from the bill."
            value={form.dealerName}
            onChange={(value) => updateField('dealerName', value)}
          />
          <Input
            label="Dealer code"
            hint="Optional dealer code, if provided by the seller."
            value={form.dealerCode}
            onChange={(value) => updateField('dealerCode', value)}
          />
          <label className="md:col-span-2 rounded-lg border border-gray-700 bg-gray-900 p-4">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
              <FileUp size={16} />
              Bill upload <span className="text-red-600">*</span>
            </span>
            <span className="mb-3 block text-xs text-limac-muted">
              Upload one JPG, PNG or PDF bill, maximum 2 MB.
            </span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(event) => setBill(event.target.files?.[0] || null)}
              className="w-full text-sm text-limac-muted file:mr-4 file:rounded-lg file:border-0 file:bg-limac-green file:px-4 file:py-2 file:font-semibold file:text-limac-black"
            />
            {billError ? <span className="mt-2 block text-xs text-red-600">{billError}</span> : null}
          </label>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-5">
          <dl className="grid gap-4 text-sm md:grid-cols-2">
            <ReviewItem label="Name" value={form.name} />
            <ReviewItem label="Mobile" value={maskMobile(form.mobileNumber)} />
            <ReviewItem label="Serial" value={maskSerial(form.serialNumber)} />
            <ReviewItem label="Purchase date" value={form.purchaseDate} />
            <ReviewItem label="Invoice" value={form.invoiceNumber} />
            <ReviewItem label="Dealer" value={form.dealerName} />
          </dl>
          <div className="mt-6 space-y-3">
            <Checkbox
              label="I accept the Limac warranty terms."
              checked={form.warrantyTermsConsent}
              onChange={(checked) => updateField('warrantyTermsConsent', checked)}
            />
            <Checkbox
              label="I consent to the privacy policy for warranty processing."
              checked={form.privacyPolicyConsent}
              onChange={(checked) => updateField('privacyPolicyConsent', checked)}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        {step === 2 ? (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-5 py-3 text-sm font-semibold text-white"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        ) : (
          <Link href="/warranty/status" className="text-sm font-semibold text-limac-blue">
            Already submitted? Check status
          </Link>
        )}
        {step === 1 ? (
          <button
            type="button"
            disabled={!canReview()}
            onClick={() => setStep(2)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            Review
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Submit
          </button>
        )}
      </div>
    </form>
  )
}

function Input({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  className,
  required = false,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  type?: string
  className?: string
  required?: boolean
  hint?: string
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-sm font-semibold text-white">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      {hint ? <span className="mb-2 block text-xs text-limac-muted">{hint}</span> : null}
      <input
        type={type}
        required={required}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-3 text-sm text-white outline-none transition focus:border-limac-green"
      />
    </label>
  )
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-limac-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-gray-700 text-limac-green"
      />
      <span>{label}</span>
    </label>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-limac-muted">{label}</dt>
      <dd className="mt-1 font-semibold text-white">{value || 'Not provided'}</dd>
    </div>
  )
}
