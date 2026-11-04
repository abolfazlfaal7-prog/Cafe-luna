import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "menu-images";
const MEMORY_BUCKET = "memory-images";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const PBKDF2_ITERATIONS = 210000;
const encoder = new TextEncoder();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

async function derivePassword(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivePassword(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, iterations, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const actual = await derivePassword(password, fromB64(saltB64), Number(iterations));
  const expected = fromB64(hashB64);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

async function isAdminConfigured() {
  const { data, error } = await supabase.from("admin_settings").select("id").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data !== null;
}

async function isPasswordValid(password: string) {
  const { data, error } = await supabase
    .from("admin_settings")
    .select("password_hash")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  return verifyPassword(password, data.password_hash);
}

function readPasswordInput(value: unknown) {
  if (typeof value !== "string" || value.length < 6 || value.length > 200) {
    throw new HttpError(400, "رمز عبور باید حداقل ۶ کاراکتر باشد.");
  }
  return value;
}

function readText(value: unknown, field: string, maxLength: number, required: boolean) {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) throw new HttpError(400, `${field} را وارد کنید.`);
  if (text.length > maxLength) throw new HttpError(400, `${field} بیش از حد طولانی است.`);
  return text;
}

function readPrice(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const price = Number(value);
  if (!Number.isInteger(price) || price < 0 || price > 100000000) {
    throw new HttpError(400, "قیمت وارد شده معتبر نیست.");
  }
  return price;
}

function matchesImageSignature(bytes: Uint8Array, contentType: string) {
  const startsWith = (sig: number[]) => sig.every((byte, i) => bytes[i] === byte);
  if (contentType === "image/jpeg") return startsWith([0xff, 0xd8, 0xff]);
  if (contentType === "image/png") return startsWith([0x89, 0x50, 0x4e, 0x47]);
  if (contentType === "image/webp") {
    return startsWith([0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45;
  }
  return false;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function uploadImage(image: unknown) {
  const input = image as { base64?: unknown; contentType?: unknown };
  if (typeof input.base64 !== "string" || typeof input.contentType !== "string") {
    throw new HttpError(400, "فایل تصویر نامعتبر است.");
  }
  if (!(input.contentType in EXTENSIONS)) {
    throw new HttpError(400, "فقط فایل‌های JPG، PNG یا WEBP مجاز هستند.");
  }
  let bytes: Uint8Array;
  try {
    bytes = fromB64(input.base64);
  } catch {
    throw new HttpError(400, "فایل تصویر نامعتبر است.");
  }
  if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(400, "حجم تصویر نباید بیش از ۳ مگابایت باشد.");
  if (!matchesImageSignature(bytes, input.contentType)) {
    throw new HttpError(400, "محتوای فایل با نوع آن مطابقت ندارد.");
  }

  const path = `${crypto.randomUUID()}.${EXTENSIONS[input.contentType]}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: input.contentType, upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

async function removeImage(url: string | null, bucket = BUCKET) {
  if (!url) return;
  const marker = `/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return;
  const path = decodeURIComponent(url.slice(index + marker.length));
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error("image removal failed", error);
}

async function listMenu() {
  const [categories, products] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("*").order("sort_order").order("created_at"),
  ]);
  if (categories.error) throw categories.error;
  if (products.error) throw products.error;
  return { categories: categories.data, products: products.data };
}

async function saveProduct(raw: Record<string, unknown>) {
  const input = (raw.product ?? {}) as Record<string, unknown>;
  const name = readText(input.name, "نام محصول", 120, true);
  const description = readText(input.description, "توضیحات", 500, false);
  const price = readPrice(input.price);
  const categoryId = readText(input.category_id, "دسته‌بندی", 64, true);
  const isActive = input.is_active !== false;
  const id = typeof input.id === "string" ? input.id : null;

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (categoryError) throw categoryError;
  if (!category) throw new HttpError(400, "دسته‌بندی انتخاب‌شده معتبر نیست.");

  let existingImage: string | null = null;
  let sortOrder = 0;
  if (id) {
    const { data: existing, error } = await supabase
      .from("products")
      .select("image_url")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!existing) throw new HttpError(404, "محصول پیدا نشد.");
    existingImage = existing.image_url;
  } else {
    const { data: last, error } = await supabase
      .from("products")
      .select("sort_order")
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    sortOrder = last ? last.sort_order + 1 : 1;
  }

  let imageUrl = existingImage;
  if (raw.remove_image === true) imageUrl = null;
  if (raw.image) imageUrl = await uploadImage(raw.image);

  const values = {
    category_id: categoryId,
    name,
    description,
    price,
    is_active: isActive,
    image_url: imageUrl,
    updated_at: new Date().toISOString(),
  };

  const query = id
    ? supabase.from("products").update(values).eq("id", id)
    : supabase.from("products").insert({ ...values, sort_order: sortOrder });
  const { data, error } = await query.select("*").single();
  if (error) throw error;

  if (existingImage && existingImage !== imageUrl) await removeImage(existingImage);
  return data;
}

async function deleteProduct(id: unknown) {
  if (typeof id !== "string") throw new HttpError(400, "محصول نامعتبر است.");
  const { data: existing, error: readError } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new HttpError(404, "محصول پیدا نشد.");

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  await removeImage(existing.image_url);
}

async function setCategoryOrder(raw: unknown) {
  if (!Array.isArray(raw) || !raw.every((id) => typeof id === "string")) {
    throw new HttpError(400, "ترتیب دسته‌بندی‌ها نامعتبر است.");
  }
  const { data: categories, error } = await supabase.from("categories").select("id");
  if (error) throw error;
  const known = new Set(categories.map((c) => c.id));
  if (raw.length !== known.size || !raw.every((id) => known.has(id))) {
    throw new HttpError(400, "ترتیب دسته‌بندی‌ها نامعتبر است.");
  }

  const results = await Promise.all(
    raw.map((id, index) => supabase.from("categories").update({ sort_order: index + 1 }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

function readUuid(value: unknown) {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, "مورد نامعتبر است.");
  }
  return value;
}

async function listMemories() {
  const [memories, settings] = await Promise.all([
    supabase.from("memories").select("*").order("created_at", { ascending: false }),
    supabase.from("site_settings").select("memories_enabled").eq("id", 1).maybeSingle(),
  ]);
  if (memories.error) throw memories.error;
  if (settings.error) throw settings.error;
  return { memories: memories.data, memories_enabled: settings.data?.memories_enabled === true };
}

async function setMemoryStatus(raw: Record<string, unknown>) {
  const id = readUuid(raw.id);
  const status = raw.status;
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    throw new HttpError(400, "وضعیت نامعتبر است.");
  }
  const { data, error } = await supabase
    .from("memories")
    .update({ status, reviewed_at: status === "pending" ? null : new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "خاطره پیدا نشد.");
  return data;
}

async function deleteMemory(rawId: unknown) {
  const id = readUuid(rawId);
  const { data: existing, error: readError } = await supabase
    .from("memories")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new HttpError(404, "خاطره پیدا نشد.");

  const { error } = await supabase.from("memories").delete().eq("id", id);
  if (error) throw error;
  await removeImage(existing.image_url, MEMORY_BUCKET);
}

async function setMemoriesEnabled(enabled: unknown) {
  if (typeof enabled !== "boolean") throw new HttpError(400, "مقدار نامعتبر است.");
  const { error } = await supabase
    .from("site_settings")
    .update({ memories_enabled: enabled, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw error;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") throw new HttpError(405, "درخواست نامعتبر است.");
    const body = (await req.json()) as Record<string, unknown>;
    const action = body.action;

    if (action === "status") {
      return json({ configured: await isAdminConfigured() });
    }

    if (action === "setup") {
      const password = readPasswordInput(body.password);
      if (await isAdminConfigured()) throw new HttpError(409, "رمز عبور قبلاً تنظیم شده است.");
      const { error } = await supabase
        .from("admin_settings")
        .insert({ id: 1, password_hash: await hashPassword(password) });
      if (error) {
        if (error.code === "23505") throw new HttpError(409, "رمز عبور قبلاً تنظیم شده است.");
        throw error;
      }
      return json({ ok: true });
    }

    if (action === "login") {
      const password = readPasswordInput(body.password);
      if (!(await isPasswordValid(password))) throw new HttpError(401, "رمز عبور اشتباه است.");
      return json({ ok: true });
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (!(await isPasswordValid(password))) throw new HttpError(401, "رمز عبور اشتباه است.");

    if (action === "list") return json(await listMenu());
    if (action === "save_product") return json({ product: await saveProduct(body) });
    if (action === "delete_product") {
      await deleteProduct(body.id);
      return json({ ok: true });
    }
    if (action === "set_category_order") {
      await setCategoryOrder(body.order);
      return json({ ok: true });
    }
    if (action === "list_memories") return json(await listMemories());
    if (action === "set_memory_status") return json({ memory: await setMemoryStatus(body) });
    if (action === "delete_memory") {
      await deleteMemory(body.id);
      return json({ ok: true });
    }
    if (action === "set_memories_enabled") {
      await setMemoriesEnabled(body.enabled);
      return json({ ok: true });
    }

    throw new HttpError(400, "درخواست نامعتبر است.");
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("admin function failed", err);
    return json({ error: "خطای سرور. لطفاً دوباره تلاش کنید." }, 500);
  }
});
