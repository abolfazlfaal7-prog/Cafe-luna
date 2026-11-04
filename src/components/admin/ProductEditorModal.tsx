import { useEffect, useState, type FormEvent } from 'react';
import { ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import { adminApi, type ImagePayload } from '@/lib/adminApi';
import { prepareImageForUpload } from '@/lib/imageUpload';
import { toLatinDigits } from '@/lib/text';
import type { Category, Product } from '@/types/menu';

type ProductEditorModalProps = {
  password: string;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

const inputClass =
  'w-full rounded-xl bg-cream-100 px-4 py-3 text-forest-900 ring-1 ring-forest-900/10 outline-none transition placeholder:text-stone-500 focus:ring-2 focus:ring-caramel-500';

export default function ProductEditorModal({
  password,
  product,
  categories,
  onClose,
  onSaved,
}: ProductEditorModalProps) {
  const isNew = product === null;
  const [name, setName] = useState(product?.name ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? '');
  const [price, setPrice] = useState(product?.price?.toString() ?? '');
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [image, setImage] = useState<ImagePayload | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const previewSrc = image
    ? `data:${image.contentType};base64,${image.base64}`
    : removeImage
      ? null
      : product?.image_url ?? null;

  const handleImageChange = async (file: File | undefined) => {
    if (!file) return;
    setProcessingImage(true);
    setError(null);
    try {
      setImage(await prepareImageForUpload(file));
      setRemoveImage(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تصویر پردازش نشد.');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || processingImage) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('نام محصول را وارد کنید.');
      return;
    }
    const normalizedPrice = toLatinDigits(price).replace(/,/g, '').trim();
    const priceValue = normalizedPrice === '' ? null : Number(normalizedPrice);
    if (priceValue !== null && (!Number.isInteger(priceValue) || priceValue < 0)) {
      setError('قیمت وارد شده معتبر نیست.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await adminApi.saveProduct(
        password,
        {
          id: product?.id,
          name: trimmedName,
          description: description.trim(),
          price: priceValue,
          category_id: categoryId,
          is_active: isActive,
        },
        image,
        removeImage,
      );
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ذخیره انجام نشد. لطفاً دوباره تلاش کنید.');
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!product || busy) return;
    if (!window.confirm(`«${product.name}» برای همیشه حذف شود؟`)) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.deleteProduct(password, product.id);
      await onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'حذف انجام نشد. لطفاً دوباره تلاش کنید.');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-forest-950/50 backdrop-blur-sm sm:items-center sm:p-4">
      <button type="button" aria-label="بستن" className="absolute inset-0 cursor-default" onClick={() => !busy && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'افزودن محصول' : 'ویرایش محصول'}
        className="relative max-h-[92vh] w-full animate-scale-in overflow-y-auto rounded-t-3xl bg-cream-50 p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-forest-900">{isNew ? 'افزودن محصول' : 'ویرایش محصول'}</h2>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <span className="mb-2 block text-sm font-medium text-forest-800">تصویر محصول</span>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream-200 ring-1 ring-forest-900/10">
                {previewSrc ? (
                  <img src={previewSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-stone-500" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col items-start gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-forest-900 px-4 py-2 text-sm font-bold text-cream-50 transition hover:bg-forest-700">
                  {processingImage ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-4 w-4" aria-hidden="true" />}
                  {previewSrc ? 'تغییر تصویر' : 'انتخاب تصویر'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={processingImage || busy}
                    onChange={(event) => {
                      void handleImageChange(event.target.files?.[0]);
                      event.target.value = '';
                    }}
                  />
                </label>
                {previewSrc && (
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setRemoveImage(true);
                    }}
                    className="text-sm font-medium text-red-700 transition hover:text-red-900"
                  >
                    حذف تصویر
                  </button>
                )}
              </div>
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-forest-800">نام محصول</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={inputClass} required />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-forest-800">مواد تشکیل‌دهنده و توضیحات</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className={`${inputClass} resize-none leading-[1.7]`}
            />
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-forest-800">دسته‌بندی</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-forest-800">قیمت به تومان (اختیاری)</span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="numeric"
                placeholder="مثلاً 150000"
                dir="ltr"
                className={`${inputClass} text-left`}
              />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-cream-100 px-4 py-3 ring-1 ring-forest-900/10">
            <div>
              <p className="text-sm font-bold text-forest-900">نمایش در منو</p>
              <p className="text-xs text-stone-600">{isActive ? 'این محصول برای مشتریان نمایش داده می‌شود.' : 'این محصول از منو مخفی است.'}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((v) => !v)}
              aria-label="نمایش در منو"
              className={`relative h-7 w-12 shrink-0 rounded-full transition duration-300 ${isActive ? 'bg-forest-700' : 'bg-stone-300'}`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-cream-50 shadow transition-all duration-300 ${
                  isActive ? 'start-[22px]' : 'start-0.5'
                }`}
              />
            </button>
          </div>

          {error && (
            <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            {isNew ? (
              <span />
            ) : (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                حذف محصول
              </button>
            )}
            <button
              type="submit"
              disabled={busy || processingImage}
              className="rounded-xl bg-forest-900 px-6 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'در حال ذخیره...' : 'ذخیره'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
