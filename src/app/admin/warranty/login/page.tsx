import type { Metadata } from 'next'
import AdminLoginClient from '@/components/warranty/AdminLoginClient'

export const metadata: Metadata = {
  title: 'Warranty Admin Login',
}

export default function WarrantyAdminLoginPage() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-limac-navy via-limac-black to-limac-black">
      <AdminLoginClient />
    </section>
  )
}
