import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  CakeSlice,
  Citrus,
  Coffee,
  Cookie,
  Flame,
  Globe,
  Leaf,
  Martini,
  Milk,
  Snowflake,
} from 'lucide-react';

export const categoryIcons: Record<string, LucideIcon> = {
  'fresh-juice': Citrus,
  'herbal-tea': Leaf,
  'waffle-ice-cream': Cookie,
  'cake-dessert': CakeSlice,
  smoothie: Apple,
  'hot-espresso': Coffee,
  'cold-espresso': Snowflake,
  'hot-drinks': Flame,
  milkshake: Milk,
  mocktail: Martini,
  'turkish-world-coffee': Globe,
};

export const fallbackCategoryIcon: LucideIcon = Coffee;
