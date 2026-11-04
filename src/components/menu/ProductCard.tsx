import type { LucideIcon } from 'lucide-react';
import { formatPrice } from '@/lib/price';
import type { Product } from '@/types/menu';

type ProductCardProps = {
  product: Product;
  Icon: LucideIcon;
  index: number;
};

export default function ProductCard({ product, Icon, index }: ProductCardProps) {
  return (
    <article
      style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
      className="group flex animate-fade-up gap-4 overflow-hidden rounded-2xl bg-cream-50 p-3 shadow-sm ring-1 ring-forest-900/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-forest-900/10 sm:flex-col sm:gap-0 sm:p-0"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-200 sm:h-auto sm:w-full sm:rounded-none sm:aspect-[4/3]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cream-200 to-cream-300 text-forest-700/70">
            <Icon className="h-8 w-8" strokeWidth={1.3} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-base font-bold text-forest-900">{product.name}</h3>
          {product.price !== null && (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-caramel-500/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-caramel-700">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-sm leading-[1.7] text-stone-600">{product.description}</p>
        )}
      </div>
    </article>
  );
}
