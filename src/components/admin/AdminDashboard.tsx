import { useState } from 'react';
import { ArrowDownUp, Images, LogOut, Package, QrCode } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import LunaLogo from '@/components/brand/LunaLogo';
import CategoryOrderManager from '@/components/admin/CategoryOrderManager';
import MemoriesManager from '@/components/admin/MemoriesManager';
import ProductsManager from '@/components/admin/ProductsManager';
import QrManager from '@/components/admin/QrManager';
import useAdminMenu from '@/hooks/useAdminMenu';

type Tab = 'products' | 'order' | 'memories' | 'qr';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'products', label: 'محصولات', Icon: Package },
  { id: 'order', label: 'ترتیب دسته‌ها', Icon: ArrowDownUp },
  { id: 'memories', label: 'مدیریت خاطره‌ها', Icon: Images },
  { id: 'qr', label: 'کد QR', Icon: QrCode },
];

type AdminDashboardProps = {
  password: string;
  onLogout: () => void;
};

export default function AdminDashboard({ password, onLogout }: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('products');
  const { state, refresh } = useAdminMenu(password);

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="sticky top-0 z-30 border-b border-forest-900/10 bg-cream-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <LunaLogo variant="inline" />
            <span className="hidden h-6 w-px bg-forest-900/15 sm:block" aria-hidden="true" />
            <span className="hidden text-sm font-bold text-forest-900 sm:block">پنل مدیریت</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-full px-3 py-2 text-sm font-medium text-forest-800 transition hover:bg-forest-900/5"
            >
              مشاهده منو
            </a>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-full bg-forest-900 px-4 py-2 text-sm font-bold text-cream-50 transition hover:bg-forest-700"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav
          role="tablist"
          aria-label="بخش‌های پنل مدیریت"
          className="mb-8 inline-flex w-full flex-wrap gap-1 rounded-2xl bg-cream-200/70 p-1 sm:w-auto"
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition sm:flex-none ${
                  active ? 'bg-cream-50 text-forest-900 shadow-sm' : 'text-stone-600 hover:text-forest-900'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </nav>

        {tab === 'qr' ? (
          <QrManager />
        ) : tab === 'memories' ? (
          <MemoriesManager password={password} />
        ) : state.status === 'loading' ? (
          <p className="py-16 text-center text-sm text-stone-600">در حال بارگذاری منو...</p>
        ) : state.status === 'error' ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-cream-50 px-6 py-12 text-center ring-1 ring-forest-900/10">
            <p className="font-bold text-forest-900">منو بارگذاری نشد.</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-full bg-forest-900 px-6 py-2.5 text-sm font-bold text-cream-50 transition hover:bg-forest-700"
            >
              تلاش دوباره
            </button>
          </div>
        ) : tab === 'products' ? (
          <ProductsManager password={password} menu={state.data} onChanged={refresh} />
        ) : (
          <CategoryOrderManager password={password} categories={state.data.categories} onChanged={refresh} />
        )}
      </main>
    </div>
  );
}
