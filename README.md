# LUNA CAFÉ - Online Menu

Online menu and management panel for LUNA CAFÉ. It is a Persian (RTL) single-page app built with Vite, React, TypeScript, and Tailwind CSS, backed by Supabase (PostgreSQL, Storage, and Edge Functions).

## Features

- **Online menu** (`/`): categories, products, search, product images, and prices in toman (shown only for products that have a price).
- **Admin panel** (`/admin`): password-protected. Manage products (add, edit, delete, prices, images), category order, customer memories, and the QR code.
- **Memories gallery** ("خاطره‌ها با لونا"): customers upload a photo with a name, optional caption, and consent. The admin approves or rejects each photo before it appears publicly. The section can be turned off from the admin panel.

## Requirements

- Node.js 22.12 or newer
- npm
- A Supabase project (free tier is enough)

## Installation

```bash
npm ci
```

## Environment variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the two values from Supabase (Project Settings > API):
   - `VITE_SUPABASE_URL`: your project URL, for example `https://<project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: the public `anon` key

Only `VITE_`-prefixed variables reach the browser. The service role key must never be placed in `.env` or in any frontend file. It is used only by the Edge Functions and is provided by Supabase automatically.

## Running locally

```bash
npm run dev
```

Open the address printed in the terminal. The admin panel is at `/admin`.

## Build and checks

```bash
npm run typecheck   # TypeScript check
npm run lint        # ESLint
npm run build       # production build into dist/
npm run preview     # serve the production build locally
```

The `dist/` folder is the static site. It can be hosted on any static host (Netlify, Vercel, Cloudflare Pages, or any web server with an SPA fallback to `index.html`). The `/admin` route must also fall back to `index.html`.

## Supabase setup

### 1. Database

Apply the SQL files in `supabase/migrations/` in order, using the Supabase SQL editor or the Supabase CLI:

1. `20261101074339_create_menu_schema_and_seed.sql` creates the menu tables and seeds the menu.
2. `20261103074343_create_memories_gallery_and_settings.sql` creates the memories tables, the settings row, and the `memory-images` bucket.

Both files are safe to run again.

### 2. Storage buckets

The migrations create the following public buckets. Check that they exist under Storage:

- `menu-images` (product photos, 3 MB limit)
- `memory-images` (customer photos, 5 MB limit)

### 3. Edge Functions

Deploy both functions. Their settings are in `supabase/config.toml` (`verify_jwt = false`, because they check the admin password or the submission rules themselves):

- `admin`: all admin-panel actions. Requires the admin password.
- `memories`: public submission of customer photos.

With the Supabase CLI:

```bash
supabase functions deploy admin
supabase functions deploy memories
```

### 4. First-time admin password

Open `/admin` the first time. The app asks you to create an admin password. The password is stored as a hash in the `admin_settings` table. The table is intentionally not readable from the browser. Keep the password somewhere safe, because there is no reset screen.

## Project structure

```
src/
  components/   UI (menu, admin, memories, brand)
  lib/          API clients, price and image helpers, QR code
  pages/        MenuPage and AdminPage
  types/        shared TypeScript types
public/         static assets, including the logo
supabase/
  config.toml   Edge Function settings
  functions/    admin and memories Edge Functions
  migrations/   database schema and seed data
```

Use the `@/` import alias for files under `src/` (for example `@/lib/price`).

## Deployment

1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your hosting provider's environment settings.
2. Run `npm run build`.
3. Publish the `dist/` folder.
4. Make sure the migrations, buckets, and Edge Functions above exist in the same Supabase project.

### Cloudflare Pages

This repository is configured for Cloudflare Pages. The Wrangler configuration points to `dist/`, `.nvmrc` selects Node.js 22.12.0, and `public/_redirects` sends SPA routes such as `/admin` to `index.html`.

To deploy from Git:

1. In Cloudflare, go to **Workers & Pages > Create > Pages > Connect to Git** and select this repository.
2. Use the repository root as the project root, `npm run build` as the build command, and `dist` as the build output directory.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under **Settings > Variables and Secrets** for both Production and Preview builds. These values are needed at build time. Do not add the Supabase service-role key or admin password to Cloudflare's frontend build variables.
4. Deploy. Configure the custom domain under **Custom domains** if needed.
5. Apply the Supabase migrations and deploy the `admin` and `memories` Edge Functions as described above; Cloudflare hosts only the frontend.

## Security notes

- Admin actions are checked on the server (Edge Function) with the admin password on every request.
- Customer photos are checked on the server for type (JPG, PNG, WEBP), size (5 MB), and consent before they are stored. They are published only after admin approval.
- Never commit `.env` or any service role key.
