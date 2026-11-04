/*
# Add customer memories gallery and section toggle

1. New Tables
- `memories`: photos customers submit for the "خاطره‌ها با لونا" section. Each row stores the customer's name, an optional caption, the image URL, a moderation status (pending, approved, rejected), and the consent confirmation.
- `site_settings`: a single-row table holding site-wide switches. Currently one switch: whether the memories section is shown to customers.

2. New Storage
- `memory-images` public bucket for the customer photos.

3. Security
- RLS enabled on both tables.
- Anonymous visitors can read only approved memories and the settings row.
- Nobody on the public side can insert, update or delete rows directly. Submissions go through a server function that validates the photo, and all moderation goes through the admin function that checks the admin password.
- A memory cannot be stored unless the customer confirmed they have permission to publish the photo.

4. Notes
- Safe to re-run: all statements are idempotent.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  memories_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  caption text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  consent_confirmed boolean NOT NULL DEFAULT false CHECK (consent_confirmed),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS memories_status_created_idx ON memories (status, created_at DESC);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON site_settings, memories TO anon, authenticated;
GRANT ALL ON site_settings, memories TO service_role;

DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_approved_memories" ON memories;
CREATE POLICY "public_read_approved_memories" ON memories FOR SELECT
  TO anon, authenticated USING (status = 'approved');

INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-images', 'memory-images', true)
ON CONFLICT (id) DO NOTHING;
