import { useEffect, useState, type FormEvent } from 'react';
import { Check, Heart, ImagePlus, Loader2, X } from 'lucide-react';
import type { ImagePayload } from '@/lib/adminApi';
import { submitMemory } from '@/lib/memoriesApi';
import { prepareImageForUpload } from '@/lib/imageUpload';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const inputClass =
  'w-full rounded-xl bg-cream-100 px-4 py-3 text-forest-900 ring-1 ring-forest-900/10 outline-none transition placeholder:text-stone-500 focus:ring-2 focus:ring-caramel-500';

type MemoryUploadModalProps = {
  onClose: () => void;
};

export default function MemoryUploadModal({ onClose }: MemoryUploadModalProps) {
  const [image, setImage] = useState<ImagePayload | null>(null);
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [consent, setConsent] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('فقط عکس‌های JPG، PNG یا WEBP مجاز هستند.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('حجم عکس نباید بیش از ۵ مگابایت باشد.');
      return;
    }
    setProcessing(true);
    try {
      setImage(await prepareImageForUpload(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'عکس پردازش نشد.');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || processing) return;
    if (!image) {
      setError('لطفاً یک عکس انتخاب کنید.');
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('نام خود را وارد کنید.');
      return;
    }
    if (!consent) {
      setError('برای ثبت خاطره، تأیید رضایت لازم است.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await submitMemory({
        customerName: trimmedName,
        caption: caption.trim(),
        consentConfirmed: consent,
        image,
      });
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ثبت خاطره انجام نشد. لطفاً دوباره تلاش کنید.');
    } finally {
      setBusy(false);
    }
  };

  const previewSrc = image ? `data:${image.contentType};base64,${image.base64}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-950/50 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 cursor-default"
        onClick={() => !busy && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ثبت خاطره"
        className="relative max-h-[92vh] w-full animate-scale-in overflow-y-auto rounded-t-3xl bg-cream-50 p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-forest-900">خاطره‌ها با لونا</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="بستن"
            className="flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition hover:bg-forest-900/5 disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {done ? (
          <div className="flex animate-fade-up flex-col items-center gap-5 py-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-900 text-cream-50">
              <Heart className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="text-lg font-bold leading-[1.8] text-forest-900">ممنون که بخشی از خاطرات قشنگ لونا شدی ❤️</p>
            <p className="text-sm leading-[1.8] text-stone-600">
              خاطره‌ات بعد از بررسی مدیر کافه در گالری نمایش داده می‌شود.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-xl bg-forest-900 px-6 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-700"
            >
              بستن
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="mb-2 block text-sm font-medium text-forest-800">عکس شما</span>
              <label
                className={`relative flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-cream-200/60 border-2 border-dashed border-forest-900/20 transition hover:bg-cream-200 ${
                  processing ? 'pointer-events-none' : ''
                }`}
              >
                {previewSrc ? (
                  <img src={previewSrc} alt="پیش‌نمایش عکس" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-2 text-forest-800">
                    {processing ? (
                      <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
                    ) : (
                      <ImagePlus className="h-8 w-8" aria-hidden="true" />
                    )}
                    <span className="text-sm font-bold">{processing ? 'در حال آماده‌سازی...' : 'انتخاب عکس از گالری'}</span>
                    <span className="text-xs text-stone-600">JPG، PNG یا WEBP تا ۵ مگابایت</span>
                  </span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={processing || busy}
                  onChange={(event) => {
                    void handleFile(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />
              </label>
              {previewSrc && (
                <p className="mt-2 text-xs text-stone-600">برای تغییر عکس، روی تصویر بزنید.</p>
              )}
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-forest-800">نام شما</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className={inputClass}
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-forest-800">کپشن (اختیاری)</span>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder="مثلاً لحظه‌ای خوش کنار لاته"
                className={`${inputClass} resize-none leading-[1.7]`}
              />
            </label>

            <label className="flex items-start gap-3 rounded-xl bg-cream-100 px-4 py-3 ring-1 ring-forest-900/10">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-forest-700"
              />
              <span className="text-sm leading-[1.8] text-stone-700">
                تأیید می‌کنم که رضایت افراد حاضر در عکس را برای نمایش در سایت کافه لونا گرفته‌ام.
              </span>
            </label>

            {error && (
              <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || processing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-900 px-6 py-3.5 text-sm font-bold text-cream-50 transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  ثبت خاطره من
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
