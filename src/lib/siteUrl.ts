const DEFAULT_SITE_URL = 'https://www.limac.in'

export const getSiteUrl = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!siteUrl) return DEFAULT_SITE_URL

  try {
    return new URL(siteUrl).origin
  } catch {
    return DEFAULT_SITE_URL
  }
}
