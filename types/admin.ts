import type { Database } from './supabase';

/**
 * Admin types derived from Supabase schema
 */

// Product types from Supabase
export type ProductRow = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

// Hero Image types from Supabase
export type HeroImageRow = Database['public']['Tables']['hero_images']['Row'];
export type HeroImageInsert = Database['public']['Tables']['hero_images']['Insert'];
export type HeroImageUpdate = Database['public']['Tables']['hero_images']['Update'];

/**
 * Product form data (for create/edit forms)
 * Matches the form structure with required fields
 */
export interface ProductFormData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  dimensions: {
    height: number;
    width: number;
    depth: number;
  };
  materials: string[];
  in_stock: boolean;
  featured: boolean;
}

/**
 * Helper to convert ProductRow to ProductFormData
 */
export function productRowToFormData(product: ProductRow): ProductFormData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dims = (product.dimensions || {}) as any;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: product.price,
    images: product.images || [],
    category: product.category,
    dimensions: {
      height: Number(dims.height) || 0,
      width: Number(dims.width) || 0,
      depth: Number(dims.depth) || 0,
    },
    materials: product.materials || [],
    in_stock: product.in_stock,
    featured: product.featured,
  };
}
