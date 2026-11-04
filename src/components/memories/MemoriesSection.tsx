import { useCallback, useEffect, useState } from 'react';
import { Camera, Heart, ImagePlus } from 'lucide-react';
import MemoryLightbox from '@/components/memories/MemoryLightbox';
import MemoryUploadModal from '@/components/memories/MemoryUploadModal';
import { fetchPublicMemories, type PublicMemoriesState } from '@/lib/memoriesApi';
import type { PublicMemory } from '@/types/memory';

type LoadState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: PublicMemoriesState };

export default function MemoriesSection() {
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewing, setViewing] = useState<PublicMemory | null>(null);

  const loadMemories = useCallback(async () => {
    setLoadState({ status: 'loading' });
    try {
      setLoadState({ status: 'ready', data: await fetchPublicMemories() });
    } catch (error) {
      console.error('memories load failed', error);
      setLoadState({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void loadMemories();
  }, [loadMemories]);

  if (loadState.status === 'ready' && !loadState.data.enabled) return null;

  const memories = loadState.status === 'ready' ? loadState.data.memories : [];

  return (
    <section aria-labelledby="memories-title" className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-28 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] bg-cream-50 p-6 shadow-sm ring-1 ring-forest-900/5 sm:p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-900/5 px-4 py-1.5 text-xs font-bold tracking-wide text-caramel-700">
            <Heart className="h-3.5 w-3.5 fill-caramel-500 text-caramel-500" aria-hidden="true" />
            گالری مشتریان
          </span>
          <h2 id="memories-title" className="text-2xl font-bold text-forest-900 sm:text-3xl">
            خاطره‌ها با لونا
          </h2>
          <p className="max-w-xl text-sm leading-[1.9] text-stone-600">
            لحظه‌های قشنگتون رو با ما به اشتراک بذارید...
          </p>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-forest-900 px-6 py-3 text-sm font-bold text-cream-50 shadow-md shadow-forest-900/15 transition duration-300 hover:-translate-y-0.5 hover:bg-forest-700 hover:shadow-lg"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            ثبت خاطره من
          </button>
        </div>

        <div className="mt-10">
          {loadState.status === 'loading' && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton aspect-square rounded-2xl" />
              ))}
            </div>
          )}

          {loadState.status === 'error' && (
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-cream-100 px-6 py-10 text-center ring-1 ring-forest-900/10">
              <p className="font-bold text-forest-900">گالری در حال حاضر بارگذاری نشد.</p>
              <button
                type="button"
                onClick={() => void loadMemories()}
                className="rounded-full bg-forest-900 px-6 py-2.5 text-sm font-bold text-cream-50 transition hover:bg-forest-700"
              >
                تلاش دوباره
              </button>
            </div>
          )}

          {loadState.status === 'ready' && memories.length === 0 && (
            <div className="flex animate-fade-in flex-col items-center gap-3 rounded-2xl bg-cream-100 px-6 py-12 text-center ring-1 ring-forest-900/10">
              <ImagePlus className="h-8 w-8 text-forest-700/70" aria-hidden="true" />
              <p className="font-bold text-forest-900">اولین خاطره را شما ثبت کنید</p>
              <p className="text-sm text-stone-600">بعد از تأیید مدیر کافه، عکس شما اینجا نمایش داده می‌شود.</p>
            </div>
          )}

          {loadState.status === 'ready' && memories.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {memories.map((memory, index) => (
                <button
                  key={memory.id}
                  type="button"
                  onClick={() => setViewing(memory)}
                  style={{ animationDelay: `${Math.min(index, 12) * 60}ms` }}
                  aria-label={`نمایش خاطره ${memory.customer_name}`}
                  className="group relative aspect-square animate-fade-up overflow-hidden rounded-2xl bg-cream-200 text-start ring-1 ring-forest-900/5 transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-forest-900/15"
                >
                  <img
                    src={memory.image_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-forest-950/80 to-transparent px-3 pb-3 pt-10">
                    <span className="block truncate text-sm font-bold text-cream-50">{memory.customer_name}</span>
                    {memory.caption && (
                      <span className="block truncate text-xs text-cream-200">{memory.caption}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {uploadOpen && <MemoryUploadModal onClose={() => setUploadOpen(false)} />}
      {viewing && <MemoryLightbox memory={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}
