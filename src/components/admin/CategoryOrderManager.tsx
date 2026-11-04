import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Loader2, RotateCcw } from 'lucide-react';
import { adminApi } from '@/lib/adminApi';
import { categoryIcons, fallbackCategoryIcon } from '@/lib/categoryIcons';
import type { Category } from '@/types/menu';

type CategoryOrderManagerProps = {
  password: string;
  categories: Category[];
  onChanged: () => Promise<void>;
};

export default function CategoryOrderManager({ password, categories, onChanged }: CategoryOrderManagerProps) {
  const savedOrder = categories.map((category) => category.id);
  const [order, setOrder] = useState<string[]>(savedOrder);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = new Map(categories.map((category) => [category.id, category]));
  const dirty = order.join('|') !== savedOrder.join('|');

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setSaved(false);
  };

  const reset = () => {
    setOrder(savedOrder);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await adminApi.saveCategoryOrder(password, order);
      await onChanged();
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ترتیب ذخیره نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-forest-900">ترتیب دسته‌بندی‌ها</h2>
        <p className="mt-1 text-sm leading-[1.7] text-stone-600">
          دسته‌ها را بالا و پایین ببرید. ترتیب جدید بلافاصله در منوی مشتریان اعمال می‌شود.
        </p>
      </div>

      <ol className="space-y-3">
        {order.map((id, index) => {
          const category = byId.get(id);
          if (!category) return null;
          const Icon = categoryIcons[id] ?? fallbackCategoryIcon;
          return (
            <li
              key={id}
              className="flex items-center gap-4 rounded-2xl bg-cream-50 px-4 py-3 shadow-sm ring-1 ring-forest-900/5 transition"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-bold text-cream-50">
                {(index + 1).toLocaleString('fa-IR')}
              </span>
              <Icon className="h-4 w-4 shrink-0 text-forest-700" aria-hidden="true" />
              <span className="flex-1 font-bold text-forest-900">{category.name}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || saving}
                  aria-label={`بالا بردن ${category.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-forest-800 transition hover:bg-forest-900/5 disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1 || saving}
                  aria-label={`پایین بردن ${category.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-forest-800 transition hover:bg-forest-900/5 disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={reset}
          disabled={!dirty || saving}
          className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-forest-800 transition hover:bg-forest-900/5 disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          انصراف
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-forest-900 px-6 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : saved && !dirty ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : null}
          {saving ? 'در حال ذخیره...' : saved && !dirty ? 'ترتیب ذخیره شد' : 'ذخیره ترتیب'}
        </button>
      </div>
    </div>
  );
}
