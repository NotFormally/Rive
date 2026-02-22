// Shared menu data model & Supabase-backed store
import { supabase } from './supabase';

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  allergens: string[];
  available: boolean;
  imageUrl?: string;
  translations?: Record<string, { name: string; description: string }>;
};

export type MenuCategory = {
  id: string;
  name: string;
  order: number;
  icon?: string;
};

export type RestaurantInfo = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  hours: string;
  logoUrl?: string;
};

// Default data (used as fallback if Supabase is empty or unavailable)
export const DEFAULT_CATEGORIES: MenuCategory[] = [
  { id: 'entrees', name: 'Entrées', order: 0, icon: '🥗' },
  { id: 'plats', name: 'Plats Principaux', order: 1, icon: '🍽️' },
  { id: 'desserts', name: 'Desserts', order: 2, icon: '🍰' },
  { id: 'boissons', name: 'Boissons', order: 3, icon: '🥂' },
];

export const SAMPLE_ITEMS: MenuItem[] = [
  {
    id: '1', name: 'Soupe à l\'oignon gratinée', description: 'Bouillon de bœuf riche, oignons caramélisés, croûton et gruyère fondu.', price: 12.00,
    categoryId: 'entrees', allergens: ['Gluten', 'Produits laitiers'], available: true,
    translations: { en: { name: 'French Onion Soup', description: 'Rich beef broth, caramelized onions, crusty bread, and melted Gruyère.' }, es: { name: 'Sopa de Cebolla Gratinada', description: 'Caldo de res, cebollas caramelizadas, crutón y queso Gruyère fundido.' } }
  },
  {
    id: '2', name: 'Tartare de Saumon', description: 'Saumon frais coupé au couteau, avocat, câpres, vinaigrette aux agrumes.', price: 18.00,
    categoryId: 'entrees', allergens: ['Poisson'], available: true,
    translations: { en: { name: 'Salmon Tartare', description: 'Hand-cut fresh salmon, avocado, capers, citrus vinaigrette.' }, es: { name: 'Tartar de Salmón', description: 'Salmón fresco cortado a cuchillo, aguacate, alcaparras, vinagreta cítrica.' } }
  },
  {
    id: '3', name: 'Bavette de Bœuf Grillée', description: 'Bavette AAA grillée au charbon, frites maison, sauce au poivre vert.', price: 32.00,
    categoryId: 'plats', allergens: [], available: true,
    translations: { en: { name: 'Grilled Flank Steak', description: 'AAA charcoal-grilled flank steak, house-cut fries, green peppercorn sauce.' }, es: { name: 'Bavette de Res a la Parrilla', description: 'Bavette AAA a la parrilla, papas fritas caseras, salsa de pimienta verde.' } }
  },
  {
    id: '4', name: 'Risotto aux Champignons Sauvages', description: 'Riz arborio crémeux, cèpes et girolles, parmesan vieilli 24 mois.', price: 26.00,
    categoryId: 'plats', allergens: ['Produits laitiers'], available: true,
    translations: { en: { name: 'Wild Mushroom Risotto', description: 'Creamy arborio rice with porcini and chanterelle mushrooms, 24-month aged Parmesan.' }, es: { name: 'Risotto de Setas Silvestres', description: 'Arroz arborio cremoso, boletus y rebozuelos, parmesano añejado 24 meses.' } }
  },
  {
    id: '5', name: 'Crème Brûlée à la Vanille', description: 'Crème infusée à la vanille de Madagascar, caramel croustillant.', price: 11.00,
    categoryId: 'desserts', allergens: ['Produits laitiers', 'Œufs'], available: true,
    translations: { en: { name: 'Vanilla Crème Brûlée', description: 'Madagascar vanilla-infused custard, crisp caramel top.' }, es: { name: 'Crème Brûlée de Vainilla', description: 'Crema infusionada con vainilla de Madagascar, caramelo crujiente.' } }
  },
  {
    id: '6', name: 'Vin Rouge Maison', description: 'Cabernet Sauvignon, Vallée de l\'Okanagan. Verre 5oz.', price: 14.00,
    categoryId: 'boissons', allergens: ['Sulfites'], available: true,
    translations: { en: { name: 'House Red Wine', description: 'Cabernet Sauvignon, Okanagan Valley. 5oz glass.' }, es: { name: 'Vino Tinto de la Casa', description: 'Cabernet Sauvignon, Valle de Okanagan. Copa de 5oz.' } }
  },
];

export const DEFAULT_RESTAURANT_INFO: RestaurantInfo = {
  name: 'Chez Marcel',
  tagline: 'Cuisine française contemporaine',
  address: '1234 Rue Saint-Denis, Montréal, QC',
  phone: '(514) 555-0147',
  hours: 'Mar-Sam : 17h-23h | Dim : 10h-15h (Brunch)',
};

// --- Supabase Row ↔ App Type Mappers ---

function rowToCategory(row: Record<string, unknown>): MenuCategory {
  return { id: row.id as string, name: row.name as string, order: row.sort_order as number, icon: (row.icon as string) || undefined };
}

function rowToItem(row: Record<string, unknown>): MenuItem {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    price: Number(row.price),
    categoryId: row.category_id as string,
    allergens: (row.allergens as string[]) || [],
    available: row.available as boolean,
    imageUrl: (row.image_url as string) || undefined,
    translations: (row.translations as Record<string, { name: string; description: string }>) || undefined,
  };
}

function rowToRestaurant(row: Record<string, unknown>): RestaurantInfo {
  return {
    name: row.name as string,
    tagline: (row.tagline as string) || '',
    address: (row.address as string) || '',
    phone: (row.phone as string) || '',
    hours: (row.hours as string) || '',
    logoUrl: (row.logo_url as string) || undefined,
  };
}

// --- Supabase CRUD Operations ---

export async function loadMenuFromSupabase(): Promise<{ categories: MenuCategory[]; items: MenuItem[]; restaurant: RestaurantInfo }> {
  try {
    const [catRes, itemRes, restoRes] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort_order'),
      supabase.from('menu_items').select('*'),
      supabase.from('restaurant_info').select('*').eq('id', 'default').single(),
    ]);

    if (catRes.error || itemRes.error || restoRes.error) {
      console.warn('Supabase load failed, using defaults:', catRes.error?.message || itemRes.error?.message || restoRes.error?.message);
      return { categories: DEFAULT_CATEGORIES, items: SAMPLE_ITEMS, restaurant: DEFAULT_RESTAURANT_INFO };
    }

    return {
      categories: catRes.data.map(rowToCategory),
      items: itemRes.data.map(rowToItem),
      restaurant: rowToRestaurant(restoRes.data),
    };
  } catch {
    console.warn('Supabase unavailable, using default data');
    return { categories: DEFAULT_CATEGORIES, items: SAMPLE_ITEMS, restaurant: DEFAULT_RESTAURANT_INFO };
  }
}

export async function addMenuItem(item: MenuItem): Promise<void> {
  const { error } = await supabase.from('menu_items').insert({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category_id: item.categoryId,
    allergens: item.allergens,
    available: item.available,
    image_url: item.imageUrl || null,
    translations: item.translations || {},
  });
  if (error) console.error('Failed to add menu item:', error.message);
}

export async function updateMenuItem(item: MenuItem): Promise<void> {
  const { error } = await supabase.from('menu_items').update({
    name: item.name,
    description: item.description,
    price: item.price,
    category_id: item.categoryId,
    allergens: item.allergens,
    available: item.available,
    image_url: item.imageUrl || null,
    translations: item.translations || {},
  }).eq('id', item.id);
  if (error) console.error('Failed to update menu item:', error.message);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase.from('menu_items').delete().eq('id', id);
  if (error) console.error('Failed to delete menu item:', error.message);
}

export async function toggleMenuItemAvailability(id: string, currentlyAvailable: boolean): Promise<void> {
  const { error } = await supabase.from('menu_items').update({ available: !currentlyAvailable }).eq('id', id);
  if (error) console.error('Failed to toggle availability:', error.message);
}

// Legacy sync functions (kept for backward compat during migration, will be removed)
export function loadMenu(): { categories: MenuCategory[]; items: MenuItem[]; restaurant: RestaurantInfo } {
  return { categories: DEFAULT_CATEGORIES, items: SAMPLE_ITEMS, restaurant: DEFAULT_RESTAURANT_INFO };
}

export function saveMenu(_data: { categories: MenuCategory[]; items: MenuItem[]; restaurant: RestaurantInfo }) {
  // No-op: all writes now go through Supabase functions above
}
