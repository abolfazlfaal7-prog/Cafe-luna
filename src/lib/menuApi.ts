import { supabase } from '@/lib/supabase';
import type { Category, Product } from '@/types/menu';

export async function fetchPublicMenu(): Promise<{ categories: Category[]; products: Product[] }> {
  const [categories, products] = await Promise.all([
    supabase.from('categories').select('id, name, sort_order').order('sort_order'),
    supabase
      .from('products')
      .select('id, category_id, name, description, price, image_url, is_active, sort_order')
      .eq('is_active', true)
      .order('sort_order'),
  ]);

  if (categories.error) throw categories.error;
  if (products.error) throw products.error;

  return {
    categories: categories.data ?? [],
    products: products.data ?? [],
  };
}
