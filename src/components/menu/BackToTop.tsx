import { ArrowUp } from 'lucide-react';
import useScrolledPastThreshold from '@/hooks/useScrolledPastThreshold';

export default function BackToTop() {
  const visible = useScrolledPastThreshold(480);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="بازگشت به بالای صفحه"
      className={`fixed bottom-6 start-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-forest-900 text-cream-100 shadow-lg shadow-forest-900/25 transition duration-300 hover:bg-forest-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <ArrowUp className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
