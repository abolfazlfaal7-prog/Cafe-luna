import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { PublicMemory } from '@/types/memory';

type MemoryLightboxProps = {
  memory: PublicMemory;
  onClose: () => void;
};

export default function MemoryLightbox({ memory, onClose }: MemoryLightboxProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="نمایش خاطره" className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <button type="button" aria-label="بستن" className="absolute inset-0 cursor-default bg-forest-950/90 backdrop-blur-sm" onClick={onClose} />
      <button
        type="button"
        onClick={onClose}
        aria-label="بستن"
        className="absolute end-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-cream-50/10 text-cream-50 transition hover:bg-cream-50/20"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <figure className="relative flex max-h-full w-full max-w-3xl animate-scale-in flex-col items-center">
        <img
          src={memory.image_url}
          alt={memory.caption || `خاطره ${memory.customer_name}`}
          className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
        />
        <figcaption className="mt-5 text-center">
          <p className="text-base font-bold text-cream-50">{memory.customer_name}</p>
          {memory.caption && <p className="mt-1.5 text-sm leading-[1.8] text-cream-200">{memory.caption}</p>}
        </figcaption>
      </figure>
    </div>
  );
}
