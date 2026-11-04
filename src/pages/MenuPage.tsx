import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Coffee } from 'lucide-react';
import LogoWatermark from '@/components/brand/LogoWatermark';
import LunaLogo from '@/components/brand/LunaLogo';
import BackToTop from '@/components/menu/BackToTop';
import CategoryCards from '@/components/menu/CategoryCards';
import ProductCard from '@/components/menu/ProductCard';
import SearchField from '@/components/menu/SearchField';
import MemoriesSection from '@/components/memories/MemoriesSection';
import { categoryIcons, fallbackCategoryIcon } from '@/lib/categoryIcons';
import { fetchPublicMenu } from '@/lib/menuApi';
import { normalizeSearchText } from '@/lib/text';
import type { Category, Product } from '@/types/menu';

type MenuData = { categories: Category[]; products: Product[] };

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: MenuData };

export default function MenuPage() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoadState({ status: 'loading' });
    try {
      const data = await fetchPublicMenu();
      setLoadState({ status: 'ready', data });
    } catch (error) {
      console.error('menu load failed', error);
      setLoadState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const counts = useMemo(() => {
    if (loadState.status !== 'ready') return {};
    return loadState.data.products.reduce<Record<string, number>>((acc, product) => {
      acc[product.category_id] = (acc[product.category_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [loadState]);

  if (loadState.status !== 'ready') {
    return (
      <PageShell>
        <MenuHero />
        <div className="mx-auto w-full max-w-5xl px-4 pb-16">
          {loadState.status === 'loading' ? (
            <LoadingState />
          ) : (
            <ErrorState onRetry={loadMenu} />
          )}
        </div>
      </PageShell>
    );
  }

  const { categories, products } = loadState.data;
  const normalizedQuery = normalizeSearchText(query);
  const visibleSections = categories
    .filter((category) => selectedId === null || category.id === selectedId)
    .map((category) => ({
      category,
      items: products.filter(
        (product) =>
          product.category_id === category.id &&
          (normalizedQuery === '' ||
            normalizeSearchText(product.name).includes(normalizedQuery) ||
            normalizeSearchText(product.description).includes(normalizedQuery)),
      ),
    }))
    .filter((section) => section.items.length > 0);

  const selectCategory = (id: string | null) => {
    setSelectedId(id);
    requestAnimationFrame(() => {
      document.getElementById('menu-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <PageShell>
      <MenuHero />

      <div className="sticky top-0 z-30 border-b border-forest-900/5 bg-cream-100/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-5xl px-4 py-3">
          <SearchField value={query} onChange={setQuery} />
        </div>
      </div>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-28 pt-8 sm:px-6">
        <section aria-label="دسته‌بندی‌ها" className="mb-10">
          <CategoryCards
            categories={categories}
            counts={counts}
            totalCount={products.length}
            allIcon={Coffee}
            iconFor={(id) => categoryIcons[id] ?? fallbackCategoryIcon}
            selectedId={selectedId}
            onSelect={selectCategory}
          />
        </section>

        <section id="menu-list" className="scroll-mt-24 space-y-12">
          {visibleSections.length === 0 ? (
            <EmptyState />
          ) : (
            visibleSections.map(({ category, items }) => {
              const Icon = categoryIcons[category.id] ?? fallbackCategoryIcon;
              return (
                <div key={category.id}>
                  <header className="mb-5 flex items-center gap-3 border-b border-forest-900/10 pb-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-cream-100">
                      <Icon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                    </span>
                    <h2 className="text-lg font-bold text-forest-900 sm:text-xl">{category.name}</h2>
                  </header>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                    {items.map((product, index) => (
                      <ProductCard key={product.id} product={product} Icon={Icon} index={index} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      <MemoriesSection />

      <BackToTop />
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cream-100">
      <LogoWatermark />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function MenuHero() {
  return (
    <header className="flex flex-col items-center px-6 pb-8 pt-12 text-center sm:pt-16">
      <LunaLogo className="animate-fade-up" />
      <h1 className="mt-10 animate-fade-up text-2xl font-bold text-forest-900 [animation-delay:120ms] sm:text-3xl">
        منوی آنلاین
      </h1>
      <p className="mt-2 animate-fade-up text-sm text-stone-600 [animation-delay:200ms]">
        همه نوشیدنی‌ها و محصولات کافه لونا
      </p>
    </header>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-forest-200 border-t-forest-700" aria-hidden="true" />
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-cream-50 px-6 py-12 text-center ring-1 ring-forest-900/10">
      <p className="font-bold text-forest-900">منوی کافه در حال حاضر نمایش داده نمی‌شود.</p>
      <p className="text-sm text-stone-600">اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-full bg-forest-900 px-6 py-2.5 text-sm font-bold text-cream-50 transition hover:bg-forest-700"
      >
        تلاش دوباره
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="animate-fade-in rounded-2xl bg-cream-50 px-6 py-14 text-center ring-1 ring-forest-900/10">
      <p className="font-bold text-forest-900">محصولی با این مشخصات پیدا نشد.</p>
      <p className="mt-2 text-sm text-stone-600">عبارت دیگری را جست‌وجو کنید یا دسته‌بندی دیگری را انتخاب کنید.</p>
    </div>
  );
}
