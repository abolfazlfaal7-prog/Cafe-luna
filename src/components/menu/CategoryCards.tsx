import type { LucideIcon } from 'lucide-react';
import type { Category } from '@/types/menu';

type CategoryCardsProps = {
  categories: Category[];
  counts: Record<string, number>;
  totalCount: number;
  allIcon: LucideIcon;
  iconFor: (categoryId: string) => LucideIcon;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export default function CategoryCards({
  categories,
  counts,
  totalCount,
  allIcon: AllIcon,
  iconFor,
  selectedId,
  onSelect,
}: CategoryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      <CategoryCard
        name="همه محصولات"
        count={totalCount}
        Icon={AllIcon}
        active={selectedId === null}
        onClick={() => onSelect(null)}
        index={0}
      />
      {categories.map((category, index) => (
        <CategoryCard
          key={category.id}
          name={category.name}
          count={counts[category.id] ?? 0}
          Icon={iconFor(category.id)}
          active={selectedId === category.id}
          onClick={() => onSelect(category.id)}
          index={index + 1}
        />
      ))}
    </div>
  );
}

type CategoryCardProps = {
  name: string;
  count: number;
  Icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  index: number;
};

function CategoryCard({ name, count, Icon, active, onClick, index }: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{ animationDelay: `${index * 40}ms` }}
      className={`group relative flex min-h-[132px] animate-fade-up flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl p-4 text-start transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel-500 ${
        active
          ? 'bg-forest-900 text-cream-50 shadow-xl shadow-forest-900/20'
          : 'bg-cream-50 text-forest-900 shadow-sm ring-1 ring-forest-900/10 hover:-translate-y-1 hover:shadow-lg hover:shadow-forest-900/10'
      }`}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition duration-300 ${
          active ? 'bg-caramel-500/25 text-caramel-400' : 'bg-forest-50 text-forest-700 group-hover:bg-forest-100'
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <span className="flex w-full flex-col gap-1">
        <span className="text-sm font-bold leading-[1.5] sm:text-base">{name}</span>
        <span className={`text-xs ${active ? 'text-cream-200' : 'text-stone-600'}`}>
          {count.toLocaleString('fa-IR')} محصول
        </span>
      </span>
    </button>
  );
}
