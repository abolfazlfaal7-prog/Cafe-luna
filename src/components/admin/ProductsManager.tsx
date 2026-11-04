import { useMemo, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import SearchField from '@/components/menu/SearchField';
import ProductEditorModal from '@/components/admin/ProductEditorModal';
import { adminApi, type AdminMenu } from '@/lib/adminApi';
import { categoryIcons, fallbackCategoryIcon } from '@/lib/categoryIcons';
import { formatPrice } from '@/lib/price';
import { normalizeSearchText } from '@/lib/text';
import type { Product } from '@/types/menu';

type ProductsManagerProps = {
  password: string;
  menu: AdminMenu;
  onChanged: () => Promise<void>;
};

type EditorState = { mode: 'create' } | { mode: 'edit'; product: Product } | null;

export default function ProductsManager({ password, menu, onChanged }: ProductsManagerProps) {
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<EditorState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const normalizedQuery = normalizeSearchText(query);
  const activeCount = menu.products.filter((p) => p.is_active).length;

  const sections = useMemo(
    () =>
      menu.categories.map((category) => ({
        category,
        products: menu.products.filter(
          (product) =>
            product.category_id === category.id &&
            (normalizedQuery === '' ||
              normalizeSearchText(product.name).includes(normalizedQuery) ||
              normalizeSearchText(product.description).includes(normalizedQuery)),
        ),
      })),
    [menu, normalizedQuery],
  );

  const toggleActive = async (product: Product) => {
    setBusyId(product.id);
    setActionError(null);
    try {
      await adminApi.saveProduct(password, {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category_id: product.category_id,
        is_active: !product.is_active,
      });
      await onChanged();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تغییر وضعیت انجام نشد.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-900">مدیریت محصولات</h2>
          <p className="mt-1 text-sm text-stone-600">
            {activeCount.toLocaleString('fa-IR')} محصول فعال از {menu.products.length.toLocaleString('fa-IR')} محصول
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: 'create' })}
          className="flex items-center justify-center gap-2 rounded-xl bg-forest-900 px-5 py-3 text-sm font-bold text-cream-50 shadow-md shadow-forest-900/15 transition hover:bg-forest-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          افزودن محصول
        </button>
      </div>

      <SearchField value={query} onChange={setQuery} />

      {actionError && (
        <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {actionError}
        </p>
      )}

      <div className="space-y-8">
        {sections.map(({ category, products }) => {
          const Icon = categoryIcons[category.id] ?? fallbackCategoryIcon;
          return (
            <section key={category.id} className="rounded-2xl bg-cream-50 p-4 shadow-sm ring-1 ring-forest-900/5 sm:p-5">
              <header className="mb-3 flex items-center gap-3 px-1">
                <Icon className="h-4 w-4 text-forest-700" aria-hidden="true" />
                <h3 className="font-bold text-forest-900">{category.name}</h3>
                <span className="text-xs text-stone-500">{products.length.toLocaleString('fa-IR')} مورد</span>
              </header>
              {products.length === 0 ? (
                <p className="px-1 py-4 text-sm text-stone-500">محصولی در این دسته پیدا نشد.</p>
              ) : (
                <ul className="divide-y divide-forest-900/5">
                  {products.map((product) => (
                    <li key={product.id} className="flex items-center gap-4 py-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-200">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-forest-600/70">
                            <Icon className="h-5 w-5" aria-hidden="true" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-forest-900">{product.name}</p>
                        <p className="truncate text-xs text-stone-600">
                          {product.description || 'بدون توضیحات'}
                          {product.price !== null && ` · ${formatPrice(product.price)}`}
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={product.is_active}
                        aria-label={product.is_active ? 'غیرفعال کردن محصول' : 'فعال کردن محصول'}
                        disabled={busyId === product.id}
                        onClick={() => void toggleActive(product)}
                        className={`relative h-7 w-12 shrink-0 rounded-full transition duration-300 disabled:opacity-50 ${
                          product.is_active ? 'bg-forest-700' : 'bg-stone-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-6 w-6 rounded-full bg-cream-50 shadow transition-all duration-300 ${
                            product.is_active ? 'start-[22px]' : 'start-0.5'
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditor({ mode: 'edit', product })}
                        aria-label={`ویرایش ${product.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest-800 transition hover:bg-forest-900/5"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {editor && (
        <ProductEditorModal
          password={password}
          product={editor.mode === 'edit' ? editor.product : null}
          categories={menu.categories}
          onClose={() => setEditor(null)}
          onSaved={onChanged}
        />
      )}
    </div>
  );
}
