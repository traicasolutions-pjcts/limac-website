import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'capacity', 'updatedAt'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Product Name',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL Slug',
      admin: {
        description: 'Auto-generated from name. Used in product URLs.',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Solar Storage', value: 'solar-storage' },
        { label: 'Electric scooter Battery', value: 'Electric scooter' },
        { label: '12V Series', value: '12v-series' },
        { label: 'LiFePO4 Lighting', value: 'lifepo4-lighting' },
      ],
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Short Tagline',
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      label: 'Short Description',
    },
    {
      name: 'capacity',
      type: 'text',
      label: 'Capacity (e.g. 100Ah)',
    },
    {
      name: 'voltage',
      type: 'text',
      label: 'Voltage (e.g. 48V)',
    },
    {
      name: 'cells',
      type: 'text',
      label: 'No. of Cells',
    },
    {
      name: 'cycleLife',
      type: 'text',
      label: 'Cycle Life (e.g. 3000+)',
    },
    {
      name: 'warranty',
      type: 'text',
      label: 'Warranty',
    },
    {
      name: 'features',
      type: 'array',
      label: 'Key Features',
      fields: [
        {
          name: 'feature',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'specs',
      type: 'array',
      label: 'Full Specifications',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Product Image',
    },
    {
      name: 'badge',
      type: 'select',
      options: [
        { label: 'Best Seller', value: 'Best Seller' },
        { label: 'New', value: 'New' },
        { label: 'Popular', value: 'Popular' },
        { label: 'Premium', value: 'Premium' },
      ],
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      label: 'Show on Homepage',
      defaultValue: false,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Published / Active',
      defaultValue: true,
    },
    {
      name: 'metaTitle',
      type: 'text',
      label: 'SEO Title',
      admin: { position: 'sidebar' },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'SEO Description',
      admin: { position: 'sidebar' },
    },
  ],
}
