import { Search, X } from 'lucide-react';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="جست‌وجوی نام محصول..."
        aria-label="جست‌وجوی نام محصول"
        className="w-full rounded-2xl bg-cream-50 py-3.5 pe-12 ps-12 text-base text-forest-900 shadow-sm ring-1 ring-forest-900/10 outline-none transition placeholder:text-stone-500 focus:ring-2 focus:ring-caramel-500 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="پاک کردن جست‌وجو"
          className="absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-stone-600 transition hover:bg-forest-900/5 hover:text-forest-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
