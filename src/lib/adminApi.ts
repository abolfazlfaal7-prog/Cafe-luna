import { supabaseAnonHeaders, supabaseFunctionsUrl } from '@/lib/supabase';
import type { Category, Product } from '@/types/menu';
import type { Memory, MemoryStatus } from '@/types/memory';

const GENERIC_ERROR = 'درخواست انجام نشد. لطفاً دوباره تلاش کنید.';

type AdminRequest = Record<string, unknown> & { action: string };

async function request<T>(body: AdminRequest): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${supabaseFunctionsUrl}/admin`, {
      method: 'POST',
      headers: { ...supabaseAnonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید.');
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    throw new Error(GENERIC_ERROR);
  }

  if (!response.ok) {
    const message = (data as { error?: unknown })?.error;
    throw new Error(typeof message === 'string' ? message : GENERIC_ERROR);
  }
  return data as T;
}

export type AdminMenu = { categories: Category[]; products: Product[] };

export type AdminMemories = { memories: Memory[]; memories_enabled: boolean };

export type ProductInput = {
  id?: string;
  name: string;
  description: string;
  price: number | null;
  category_id: string;
  is_active: boolean;
};

export type ImagePayload = { base64: string; contentType: string };

export const adminApi = {
  async status(): Promise<boolean> {
    const data = await request<{ configured: boolean }>({ action: 'status' });
    return data.configured;
  },
  async setup(password: string) {
    await request({ action: 'setup', password });
  },
  async login(password: string) {
    await request({ action: 'login', password });
  },
  async listMenu(password: string): Promise<AdminMenu> {
    const data = await request<AdminMenu>({ action: 'list', password });
    if (!Array.isArray(data.categories) || !Array.isArray(data.products)) throw new Error(GENERIC_ERROR);
    return data;
  },
  async saveProduct(
    password: string,
    product: ProductInput,
    image?: ImagePayload | null,
    removeImage = false,
  ): Promise<Product> {
    const data = await request<{ product: Product }>({
      action: 'save_product',
      password,
      product,
      image: image ?? null,
      remove_image: removeImage,
    });
    return data.product;
  },
  async deleteProduct(password: string, id: string) {
    await request({ action: 'delete_product', password, id });
  },
  async saveCategoryOrder(password: string, order: string[]) {
    await request({ action: 'set_category_order', password, order });
  },
  async listMemories(password: string): Promise<AdminMemories> {
    const data = await request<AdminMemories>({ action: 'list_memories', password });
    if (!Array.isArray(data.memories) || typeof data.memories_enabled !== 'boolean') throw new Error(GENERIC_ERROR);
    return data;
  },
  async setMemoryStatus(password: string, id: string, status: MemoryStatus) {
    await request({ action: 'set_memory_status', password, id, status });
  },
  async deleteMemory(password: string, id: string) {
    await request({ action: 'delete_memory', password, id });
  },
  async setMemoriesEnabled(password: string, enabled: boolean) {
    await request({ action: 'set_memories_enabled', password, enabled });
  },
};
