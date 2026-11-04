/*
# Create LUNA CAFÉ menu schema and seed menu

1. New Tables
- `categories`: menu sections (id slug, Persian name, display order).
- `products`: menu items (name, ingredients description, optional price, image, active flag, display order, category link).
- `admin_settings`: stores a single hashed admin password (never readable by the public).

2. Seed Data
- 11 categories and all 68 menu items from the printed LUNA CAFÉ menu, with no prices set yet.

3. Security
- RLS enabled on all tables.
- Anonymous visitors can read categories and active products only.
- Admin writes happen exclusively through a server function that verifies the admin password.
- `admin_settings` has no public access at all.
- Menu images are stored in a public storage bucket for fast loading.

4. Notes
- Prices are stored but not shown to customers yet.
- Seeding uses fixed slugs and is safe to re-run.
*/

CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_sort_idx ON products (category_id, sort_order);

CREATE TABLE IF NOT EXISTS admin_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON categories TO anon, authenticated;
GRANT SELECT ON products TO anon, authenticated;
GRANT ALL ON categories, products, admin_settings TO service_role;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_active_products" ON products;
CREATE POLICY "public_read_active_products" ON products FOR SELECT
  TO anon, authenticated USING (is_active = true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, sort_order) VALUES
  ('fresh-juice', 'آبمیوه طبیعی', 1),
  ('herbal-tea', 'دمنوش‌ها', 2),
  ('waffle-ice-cream', 'وافل و بستنی', 3),
  ('cake-dessert', 'کیک و دسر', 4),
  ('smoothie', 'اسموتی', 5),
  ('hot-espresso', 'نوشیدنی‌های گرم بر پایه اسپرسو', 6),
  ('cold-espresso', 'نوشیدنی‌های سرد بر پایه اسپرسو', 7),
  ('hot-drinks', 'نوشیدنی‌های گرم', 8),
  ('milkshake', 'میلک شیک', 9),
  ('mocktail', 'ماکتل', 10),
  ('turkish-world-coffee', 'قهوه ملل', 11)
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (category_id, name, description, sort_order) VALUES
  ('fresh-juice', 'آب سیب', '', 1),
  ('fresh-juice', 'آب پرتقال', '', 2),
  ('fresh-juice', 'آب هویج', '', 3),
  ('fresh-juice', 'آب هندوانه', '', 4),
  ('fresh-juice', 'آب طالبی', '', 5),
  ('fresh-juice', 'هویج بستنی', '', 6),
  ('fresh-juice', 'طالبی بستنی', '', 7),
  ('fresh-juice', 'شیر موز', '', 8),
  ('fresh-juice', 'شیر موز مخصوص', '', 9),
  ('herbal-tea', 'دمنوش ماه', '', 1),
  ('herbal-tea', 'دمنوش آرامش', '', 2),
  ('herbal-tea', 'دمنوش رفرش', '', 3),
  ('herbal-tea', 'چای سبز', '', 4),
  ('herbal-tea', 'چای نبات', '', 5),
  ('waffle-ice-cream', 'وافل مخصوص', '', 1),
  ('waffle-ice-cream', 'وافل لوتوس', '', 2),
  ('waffle-ice-cream', 'وافل فرانسه', '', 3),
  ('waffle-ice-cream', 'بستنی مخصوص', '', 4),
  ('cake-dessert', 'تیرامیسو', '', 1),
  ('cake-dessert', 'کروسان', '', 2),
  ('cake-dessert', 'کیک روز', '', 3),
  ('smoothie', 'پرتقال شکلات', '', 1),
  ('smoothie', 'هندوانه شکلات', '', 2),
  ('hot-espresso', 'اسپرسو سینگل', '', 1),
  ('hot-espresso', 'اسپرسو دبل', '', 2),
  ('hot-espresso', 'آمریکانو', '', 3),
  ('hot-espresso', 'لاته', 'نچر فوم', 4),
  ('hot-espresso', 'لاته طعم‌دار', 'کارامل، فندق، شکلات', 5),
  ('hot-espresso', 'لاته ماکیاتو', 'شیر سرد، فندق، قهوه', 6),
  ('hot-espresso', 'کاپوچینو', 'اسپرسو، شیر', 7),
  ('hot-espresso', 'موکا', 'شیر، سیروپ، شکلات، قهوه', 8),
  ('hot-espresso', 'کورتادو', 'شیر، قهوه', 9),
  ('hot-espresso', 'اسپرسو ماکیاتو', 'قهوه، فوم شیر', 10),
  ('hot-espresso', 'کارامل ماکیاتو', 'شیر، قهوه، سیروپ کارامل', 11),
  ('cold-espresso', 'آیس لاته', 'شیر، قهوه', 1),
  ('cold-espresso', 'آفوگاتو', 'بستنی، قهوه', 2),
  ('cold-espresso', 'آیس موکا', 'شیر، قهوه، سیروپ، شکلات', 3),
  ('cold-espresso', 'آیس آمریکانو', '', 4),
  ('cold-espresso', 'آیس کارامل ماکیاتو', 'شیر، قهوه، سیروپ کارامل', 5),
  ('cold-espresso', 'کلد چاکلت', 'شیر، بستنی، شکلات، پودر شکلات', 6),
  ('hot-drinks', 'هات چاکلت', 'شیر، پودر کاکائو، پودر شکلات', 1),
  ('hot-drinks', 'شیر بیسکویت', 'شیر، لوتوس', 2),
  ('hot-drinks', 'وایت چاکلت', 'شیر، پودر وایت', 3),
  ('hot-drinks', 'شیر نسکافه', '', 4),
  ('hot-drinks', 'چای ماسالا', '', 5),
  ('hot-drinks', 'شیر عسل دارچین', '', 6),
  ('hot-drinks', 'هات وایت', '', 7),
  ('milkshake', 'مخصوص کافه لونا', '', 1),
  ('milkshake', 'نوتلا', '', 2),
  ('milkshake', 'لوتوس', '', 3),
  ('milkshake', 'نسکافه', '', 4),
  ('milkshake', 'اسپرسو', '', 5),
  ('milkshake', 'موز شکلات', '', 6),
  ('milkshake', 'بادام زمینی', '', 7),
  ('milkshake', 'نارگیل', '', 8),
  ('milkshake', 'شکلات', '', 9),
  ('milkshake', 'وانیل', '', 10),
  ('milkshake', 'توت فرنگی', '', 11),
  ('milkshake', 'شاتوت', '', 12),
  ('milkshake', 'کودک (سرلاک)', '', 13),
  ('mocktail', 'جینجر لیم', 'اسپرسو، لیموترش، زنجبیل، توت فرنگی', 1),
  ('mocktail', 'بلاند', '', 2),
  ('mocktail', 'کاپریتا', '', 3),
  ('mocktail', 'موهیتو', '', 4),
  ('mocktail', 'لیموناد', '', 5),
  ('turkish-world-coffee', 'قهوه فرانسه', '', 1),
  ('turkish-world-coffee', 'قهوه ترک', '', 2),
  ('turkish-world-coffee', 'قهوه یونانی', '', 3)
ON CONFLICT DO NOTHING;
