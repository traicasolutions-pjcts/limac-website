import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Warranty Serial Imports',
}

export default function WarrantySerialImportsPage() {
  return (
    <section className="min-h-screen bg-limac-black px-4 pb-24 pt-32">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-white">Serial imports</h1>
        <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-6">
          <label>
            <span className="mb-2 block text-sm font-semibold text-white">CSV or XLSX file</span>
            <input
              type="file"
              accept=".csv,.xlsx"
              className="w-full text-sm text-limac-muted file:mr-4 file:rounded-lg file:border-0 file:bg-limac-green file:px-4 file:py-2 file:font-semibold file:text-limac-black"
            />
          </label>
          <button className="mt-5 rounded-lg bg-limac-green px-5 py-3 text-sm font-semibold text-limac-black">
            Dry run import
          </button>
        </div>
      </div>
    </section>
  )
}
