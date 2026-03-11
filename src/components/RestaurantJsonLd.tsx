'use client'

import { JsonLd } from './JsonLd'
import type { RestaurantInfo, MenuCategory, MenuItem } from '@/lib/menu-store'

type Props = {
  restaurant: RestaurantInfo
  categories: MenuCategory[]
  items: MenuItem[]
}

export function RestaurantJsonLd({ restaurant, categories, items }: Props) {
  const menuSections = categories.map(cat => ({
    '@type': 'MenuSection' as const,
    name: cat.name,
    hasMenuItem: items
      .filter(i => i.categoryId === cat.id && i.available)
      .map(item => ({
        '@type': 'MenuItem' as const,
        name: item.name,
        description: item.description,
        offers: {
          '@type': 'Offer' as const,
          price: item.price.toFixed(2),
          priceCurrency: 'CAD',
        },
      })),
  }))

  const data = {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'FoodEstablishment'],
    name: restaurant.name,
    description: restaurant.tagline,
    address: {
      '@type': 'PostalAddress',
      streetAddress: restaurant.address,
    },
    telephone: restaurant.phone,
    openingHours: restaurant.hours,
    hasMenu: {
      '@type': 'Menu',
      name: `Menu - ${restaurant.name}`,
      hasMenuSection: menuSections,
    },
  }

  return <JsonLd data={data} />
}
