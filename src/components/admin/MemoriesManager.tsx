import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Loader2, Trash2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { adminApi, type AdminMemories } from '@/lib/adminApi';
import type { Memory, MemoryStatus } from '@/types/memory';

type MemoriesManagerProps = {
  password: string;
};

type Filter = MemoryStatus | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'pending', label: 'در انتظار تأیید' },
  { id: 'approved', label: 'منتشر شده' },
  { id: 'rejected', label: 'رد شده' },
  { id: 'all', label: 'همه' },
];

const STATUS_LABELS: Record<MemoryStatus, string> = {
  pending: 'در انتظار تأیید',
  approved: 'منتشر شده',
  rejected: 'رد شده',
};

const STATUS_STYLES: Record<MemoryStatus, string> = {
  pending: 'bg-caramel-500/15 text-caramel-700',
  approved: 'bg-forest-900/10 text-forest-800',
  rejected: 'bg-red-50 text-red-800',
};

export default function MemoriesManager({ password }: MemoriesManagerProps) {
  const [data, setData] = useState<AdminMemories | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [togglingSection, setTogglingSection] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await adminApi.listMemories(password));
      setLoadError(false);
    } catch (error) {
      console.error('admin memories load failed', error);
      setLoadError(true);
    }
  }, [password]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const memories = data?.memories ?? [];
    return {
      pending: memories.filter((m) => m.status === 'pending').length,
      approved: memories.filter((m) => m.status === 'approved').length,
      rejected: memories.filter((m) => m.status === 'rejected').length,
      all: memories.length,
    };
  }, [data]);

  const visible = (data?.memories ?? []).filter((m) => filter === 'all' || m.status === filter);

  const runAction = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'عملیات انجام نشد.');
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = (memory: Memory, status: MemoryStatus) =>
    runAction(memory.id, () => adminApi.setMemoryStatus(password, memory.id, status));

  const removeMemory = (memory: Memory) => {
    if (!window.confirm(`خاطره «${memory.customer_name}» برای همیشه حذف شود؟`)) return;
    void runAction(memory.id, () => adminApi.deleteMemory(password, memory.id));
  };

  const toggleSection = async () => {
    if (!data) return;
    setTogglingSection(true);
    setActionError(null);
    try {
      await adminApi.setMemoriesEnabled(password, !data.memories_enabled);
      await load();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'تغییر وضعیت انجام نشد.');
    } finally {
      setTogglingSection(false);
    }
  };

  if (loadError && !data) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-cream-50 px-6 py-12 text-center ring-1 ring-forest-900/10">
        <p className="font-bold text-forest-900">خاطره‌ها بارگذاری نشد.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full bg-forest-900 px-6 py-2.5 text-sm font-bold text-cream-50 transition hover:bg-forest-700"
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (!data) {
    return <p className="py-16 text-center text-sm text-stone-600">در حال بارگذاری خاطره‌ها...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-forest-900">مدیریت خاطره‌ها</h2>
        <p className="mt-1 text-sm text-stone-600">
          فقط خاطره‌های تأییدشده در گالری عمومی سایت دیده می‌شوند.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream-50 px-5 py-4 shadow-sm ring-1 ring-forest-900/5">
        <div>
          <p className="font-bold text-forest-900">نمایش بخش خاطره‌ها در سایت</p>
          <p className="text-xs text-stone-600">
            {data.memories_enabled
              ? 'بخش خاطره‌ها برای مشتریان نمایش داده می‌شود.'
              : 'بخش خاطره‌ها از سایت مخفی است و مشتریان نمی‌توانند عکس ثبت کنند.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={data.memories_enabled}
          aria-label="نمایش بخش خاطره‌ها"
          disabled={togglingSection}
          onClick={() => void toggleSection()}
          className={`relative h-7 w-12 shrink-0 rounded-full transition duration-300 disabled:opacity-50 ${
            data.memories_enabled ? 'bg-forest-700' : 'bg-stone-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-cream-50 shadow transition-all duration-300 ${
              data.memories_enabled ? 'start-[22px]' : 'start-0.5'
            }`}
          />
        </button>
      </div>

      <div role="tablist" aria-label="فیلتر خاطره‌ها" className="flex flex-wrap gap-2">
        {FILTERS.map(({ id, label }) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                active ? 'bg-forest-900 text-cream-50 shadow-sm' : 'bg-cream-50 text-stone-700 ring-1 ring-forest-900/10 hover:text-forest-900'
              }`}
            >
              {label}
              <span className="ms-2 text-xs opacity-80">{counts[id].toLocaleString('fa-IR')}</span>
            </button>
          );
        })}
      </div>

      {actionError && (
        <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
          {actionError}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="animate-fade-in rounded-2xl bg-cream-50 px-6 py-14 text-center ring-1 ring-forest-900/10">
          <p className="font-bold text-forest-900">خاطره‌ای در این بخش نیست.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((memory) => {
            const busy = busyId === memory.id;
            return (
              <li key={memory.id} className="flex animate-fade-up flex-col overflow-hidden rounded-2xl bg-cream-50 shadow-sm ring-1 ring-forest-900/5">
                <div className="relative aspect-[4/3] bg-cream-200">
                  <img src={memory.image_url} alt={memory.caption || `خاطره ${memory.customer_name}`} loading="lazy" className="h-full w-full object-cover" />
                  <span className={`absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[memory.status]}`}>
                    {STATUS_LABELS[memory.status]}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <p className="font-bold text-forest-900">{memory.customer_name}</p>
                    <p className="text-xs text-stone-500">
                      {new Date(memory.created_at).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {' · '}
                      رضایت ثبت شده
                    </p>
                  </div>
                  {memory.caption && <p className="text-sm leading-[1.8] text-stone-700">{memory.caption}</p>}

                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {memory.status !== 'approved' && (
                      <ActionButton
                        onClick={() => void setStatus(memory, 'approved')}
                        disabled={busy}
                        Icon={Check}
                        label="تأیید و انتشار"
                        tone="primary"
                      />
                    )}
                    {memory.status !== 'rejected' && (
                      <ActionButton
                        onClick={() => void setStatus(memory, 'rejected')}
                        disabled={busy}
                        Icon={X}
                        label={memory.status === 'approved' ? 'حذف از گالری' : 'رد'}
                        tone="secondary"
                      />
                    )}
                    <ActionButton
                      onClick={() => removeMemory(memory)}
                      disabled={busy}
                      Icon={busy ? Loader2 : Trash2}
                      label="حذف"
                      tone="danger"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type ActionButtonProps = {
  onClick: () => void;
  disabled: boolean;
  Icon: LucideIcon;
  label: string;
  tone: 'primary' | 'secondary' | 'danger';
};

const TONE_CLASSES: Record<ActionButtonProps['tone'], string> = {
  primary: 'bg-forest-900 text-cream-50 hover:bg-forest-700',
  secondary: 'bg-cream-100 text-forest-900 ring-1 ring-forest-900/10 hover:bg-cream-200',
  danger: 'text-red-700 hover:bg-red-50',
};

function ActionButton({ onClick, disabled, Icon, label, tone }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition disabled:opacity-50 ${TONE_CLASSES[tone]}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
