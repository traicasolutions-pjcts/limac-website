import path from 'path'
import { promises as fs } from 'fs'
import type { BlogPost, Product } from './types'
import { withBasePath } from './basePath'

type PayloadList<T> = {
  docs: T[]
  totalDocs: number
}

const baseURL = process.env.PAYLOAD_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const apiKey = process.env.PAYLOAD_API_KEY
const mongoURI = process.env.MONGODB_URI || ''
const isMongoURIValid = /^mongodb(\+srv)?:\/\//.test(mongoURI)
const productDataSource = (process.env.PRODUCT_DATA_SOURCE || 'csv').toLowerCase()
const productFolderPath = path.join(process.cwd(), 'public', 'product')
const productCsvPath = path.join(productFolderPath, 'products.csv')

type ProductDataSource = 'csv' | 'cms' | 'hybrid'

type CsvProductRow = Record<string, string>

type PayloadMedia = {
  id?: string
  alt?: string
  url?: string
  filename?: string
}

type PayloadProductDoc = {
  id: string
  name: string
  slug: string
  category: Product['category']
  shortDescription?: string
  tagline?: string
  voltage?: string
  capacity?: string
  cycleLife?: string
  warranty?: string
  image?: string | PayloadMedia | null
  specs?: Array<{ label?: string; value?: string }>
  isFeatured?: boolean
  isActive?: boolean
}

const normalizeText = (value: string) => value.trim().toLowerCase()

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')

const parseCSVLine = (line: string): string[] => {
  const out: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const next = line[index + 1]

    if (character === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      out.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  out.push(current.trim())
  return out
}

const parseCSV = (content: string): CsvProductRow[] => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map((header) => header.replace(/^\uFEFF/, '').trim())
  return lines.slice(1).map((line) => {
    let values = parseCSVLine(line)
    if (values.length > headers.length) {
      const productImageIndex = headers.findIndex((header) => normalizeText(header) === 'productimage')
      if (productImageIndex >= 0) {
        const overflowCount = values.length - headers.length
        values = [
          ...values.slice(0, productImageIndex),
          values.slice(productImageIndex, productImageIndex + overflowCount + 1).join(','),
          ...values.slice(productImageIndex + overflowCount + 1),
        ]
      }
    }
    return headers.reduce<CsvProductRow>((row, header, index) => {
      row[header] = values[index]?.trim() || ''
      return row
    }, {})
  })
}

const inferCategory = (productName: string, specText: string): Product['category'] => {
  const haystack = `${productName} ${specText}`.toLowerCase()
  if (haystack.includes('Electric scooter') || haystack.includes('cca')) return 'Electric scooter'
  if (haystack.includes('12v')) return '12v-series'
  if (haystack.includes('street light') || haystack.includes('lighting')) return 'lifepo4-lighting'
  return 'solar-storage'
}

const normalizeCategory = (value: string, productName: string, specText: string): Product['category'] => {
  const category = value.trim()
  return category || inferCategory(productName, specText)
}

const inferVoltage = (productName: string, specText: string) => {
  const match = `${productName} ${specText}`.match(/(\d+(?:\.\d+)?)\s*v/i)
  return match ? `${match[1]}V` : 'N/A'
}

const inferCapacity = (productName: string, specText: string) => {
  const match = `${productName} ${specText}`.match(/(\d+(?:\.\d+)?)\s*ah/i)
  return match ? `${match[1]}AH` : 'N/A'
}

const getCsvValue = (row: CsvProductRow, keys: string[]) => {
  for (const key of keys) {
    const match = Object.keys(row).find((column) => normalizeText(column) === normalizeText(key))
    if (match && row[match]) return row[match]
  }
  return ''
}

const normalizeImageLookupName = (value: string) => {
  const cleanedValue = value
    .replace(/^https?:\/\/[^/]+\//i, '')
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .pop() || value

  return normalizeText(path.parse(cleanedValue).name)
    .replace(/(\d+)\s+v\b/g, '$1v')
    .replace(/(\d+)\s+ah\b/g, '$1ah')
    .replace(/\s+/g, ' ')
}

const scoreImageNameMatch = (file: string, preferredKey: string, productKey: string) => {
  const fileTokens = new Set(normalizeImageLookupName(file).split(/\s+/).filter(Boolean))
  const requestedTokens = Array.from(new Set(`${preferredKey} ${productKey}`.split(/\s+/).filter(Boolean)))

  return requestedTokens.reduce((score, token) => score + (fileTokens.has(token) ? 1 : 0), 0)
}

const findLocalImageURL = (productName: string, csvImageName: string, files: string[]) => {
  const preferred = csvImageName || productName
  const preferredKey = normalizeImageLookupName(preferred)
  const productKey = normalizeImageLookupName(productName)

  const chosenFile =
    files.find((file) => normalizeImageLookupName(file) === preferredKey) ||
    files.find((file) => normalizeImageLookupName(file) === productKey) ||
    files.find((file) => normalizeImageLookupName(file).includes(productKey)) ||
    files
      .map((file) => ({ file, score: scoreImageNameMatch(file, preferredKey, productKey) }))
      .filter((match) => match.score >= 3)
      .sort((a, b) => b.score - a.score)[0]?.file

  return chosenFile ? withBasePath(`/product/${chosenFile}`) : undefined
}

const splitImageNames = (value: string) =>
  value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)

const findLocalImageURLs = (productName: string, csvImageName: string, files: string[]) => {
  const imageNames = splitImageNames(csvImageName)
  const imageUrls = imageNames
    .map((imageName) => findLocalImageURL(productName, imageName, files))
    .filter((url): url is string => Boolean(url))

  if (imageUrls.length) {
    return Array.from(new Set(imageUrls))
  }

  const fallbackUrl = findLocalImageURL(productName, '', files)
  return fallbackUrl ? [fallbackUrl] : []
}

const splitListValue = (value: string) =>
  value
    .split(/[|;]/)
    .map((item) => item.trim())
    .filter(Boolean)

const getDefaultKeyFeatures = (cycleLife: string, operatingTemp: string) => [
  'Lithium Iron Phosphate (LiFePO4) chemistry - non-toxic, thermally stable',
  'Built-in Battery Management System (BMS) with overcharge, over-discharge, short-circuit protection',
  `${cycleLife} expected - far exceeds lead-acid batteries`,
  '80% Depth of Discharge (DoD) standard usage',
  'Maintenance-free - no water topping, no gas emission',
  `Operating range: ${operatingTemp}`,
]

const mapCsvRowToProduct = (
  row: CsvProductRow,
  index: number,
  files: string[]
): Product | null => {
  const productName =
    getCsvValue(row, ['ProductName', 'name', 'title']) ||
    getCsvValue(row, ['product'])

  if (!productName) return null

  const productSpecification = getCsvValue(row, ['ProductSpecification', 'specification', 'description'])
  const shortDescription =
    getCsvValue(row, ['ShortDescription', 'summary']) ||
    productSpecification ||
    `LiFePO4 battery product from Limac catalog: ${productName}`

  const csvImageName = getCsvValue(row, ['ProductImage', 'Image', 'image'])
  const imageUrls = findLocalImageURLs(productName, csvImageName, files)
  const finalImageURL = imageUrls[0]

  const featuredValue = getCsvValue(row, ['Featured', 'isFeatured'])
  const isFeatured = ['1', 'true', 'yes', 'y'].includes(featuredValue.toLowerCase()) || index < 6

  const category = normalizeCategory(getCsvValue(row, ['Category', 'category']), productName, productSpecification)
  const voltage = getCsvValue(row, ['Voltage']) || inferVoltage(productName, productSpecification)
  const capacity = getCsvValue(row, ['Capacity']) || inferCapacity(productName, productSpecification)
  const cycleLife = getCsvValue(row, ['CycleLife', 'Cycle Life']) || '6000+ cycles'
  const operatingTemp = getCsvValue(row, ['OperatingTemp', 'Operating Temperature']) || '-20°C to 60°C'
  const csvKeyFeatures = splitListValue(getCsvValue(row, ['KeyFeatures', 'Key Features', 'Features']))
  const keyFeatures = csvKeyFeatures.length ? csvKeyFeatures : getDefaultKeyFeatures(cycleLife, operatingTemp)

  return {
    id: getCsvValue(row, ['ProductID', 'id']) || `${index + 1}`,
    name: productName,
    slug: getCsvValue(row, ['Slug', 'slug']) || toSlug(productName),
    category,
    shortDescription,
    longDescription: getCsvValue(row, ['LongDescription', 'details']) || productSpecification || shortDescription,
    imageUrl: finalImageURL,
    imageUrls,
    imageAlt: productName,
    keyFeatures,
    specsGroup: {
      voltage,
      capacity,
      weight: getCsvValue(row, ['Weight']) || 'N/A',
      dimensions: getCsvValue(row, ['Dimensions']) || 'N/A',
      cycleLife,
      warranty: getCsvValue(row, ['Warranty']) || '3 Years',
      operatingTemp,
      application: getCsvValue(row, ['Application']) || 'Residential & Commercial Backup',
    },
    featured: isFeatured,
    status: 'published',
  }
}

const getCsvProducts = async (): Promise<Product[]> => {
  try {
    const [csvRaw, fileList] = await Promise.all([
      fs.readFile(productCsvPath, 'utf-8'),
      fs.readdir(productFolderPath),
    ])

    const imageFiles = fileList.filter((file) => /\.(png|jpe?g|webp|avif)$/i.test(file))
    const rows = parseCSV(csvRaw)

    return rows
      .map((row, index) => mapCsvRowToProduct(row, index, imageFiles))
      .filter((product): product is Product => Boolean(product))
  } catch {
    return []
  }
}

const getSpecValue = (
  specs: PayloadProductDoc['specs'],
  labels: string[],
  fallback = 'N/A'
) => {
  if (!specs?.length) return fallback
  const found = specs.find((spec) =>
    labels.some((label) => spec.label?.trim().toLowerCase() === label.toLowerCase())
  )
  return found?.value?.trim() || fallback
}

const mapProductDoc = (doc: PayloadProductDoc): Product => {
  const media = typeof doc.image === 'object' && doc.image ? doc.image : null
  const cycleLife = doc.cycleLife || getSpecValue(doc.specs, ['cycle life', 'cycleLife'])
  const operatingTemp = getSpecValue(doc.specs, ['operating temperature', 'operating temp', 'temperature range'])

  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
    category: doc.category,
    shortDescription: doc.shortDescription || doc.tagline || 'No description available.',
    longDescription: doc.tagline || doc.shortDescription || undefined,
    imageUrl: undefined,
    imageAlt: media?.alt || doc.name,
    keyFeatures: getDefaultKeyFeatures(cycleLife, operatingTemp),
    specsGroup: {
      voltage: doc.voltage || getSpecValue(doc.specs, ['voltage', 'nominal voltage']),
      capacity: doc.capacity || getSpecValue(doc.specs, ['capacity']),
      weight: getSpecValue(doc.specs, ['weight']),
      dimensions: getSpecValue(doc.specs, ['dimensions', 'dimension']),
      cycleLife,
      warranty: doc.warranty || getSpecValue(doc.specs, ['warranty']),
      operatingTemp,
      application: getSpecValue(doc.specs, ['application', 'use case']),
    },
    featured: Boolean(doc.isFeatured),
    status: doc.isActive === false ? 'draft' : 'published',
  }
}

async function payloadFetch<T>(path: string): Promise<T | null> {
  if (!isMongoURIValid) {
    return null
  }

  try {
    const res = await fetch(`${baseURL}${path}`, {
      headers: {
        ...(apiKey ? { Authorization: `users API-Key ${apiKey}` } : {}),
      },
      next: { revalidate: 120 },
    })

    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

const getCmsProducts = async (): Promise<Product[]> => {
  const imageFiles = await fs
    .readdir(productFolderPath)
    .then((files) => files.filter((file) => /\.(png|jpe?g|webp|avif)$/i.test(file)))
    .catch(() => [])

  const result = await payloadFetch<PayloadList<PayloadProductDoc>>('/api/products?where[isActive][equals]=true&depth=1&limit=100')
  return (
    result?.docs?.map((doc) => {
      const media = typeof doc.image === 'object' && doc.image ? doc.image : null
      const localImageURL = findLocalImageURL(doc.name, media?.filename || '', imageFiles)
      return {
        ...mapProductDoc(doc),
        imageUrl: localImageURL,
        imageUrls: localImageURL ? [localImageURL] : [],
      }
    }) ?? []
  )
}

export async function getProducts(): Promise<Product[]> {
  const source = (productDataSource as ProductDataSource) || 'csv'

  if (source === 'cms') {
    const cmsProducts = await getCmsProducts()
    return cmsProducts
  }

  if (source === 'hybrid') {
    const [csvProducts, cmsProducts] = await Promise.all([getCsvProducts(), getCmsProducts()])
    const merged = [...csvProducts]
    const existingSlugs = new Set(csvProducts.map((product) => product.slug))
    for (const product of cmsProducts) {
      if (!existingSlugs.has(product.slug)) merged.push(product)
    }
    return merged
  }

  return getCsvProducts()
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts()
  return products.find((product) => product.slug === slug) ?? null
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const products = await getProducts()
  const featured = products.filter((product) => product.featured)
  return featured.length ? featured : products.slice(0, 6)
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const result = await payloadFetch<PayloadList<BlogPost>>('/api/blog-posts?where[isPublished][equals]=true&sort=-publishedAt&limit=50')
  return result?.docs ?? []
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const result = await payloadFetch<PayloadList<BlogPost>>(
    `/api/blog-posts?where[slug][equals]=${encodeURIComponent(slug)}&where[isPublished][equals]=true&limit=1`
  )
  return result?.docs?.[0] ?? null
}
