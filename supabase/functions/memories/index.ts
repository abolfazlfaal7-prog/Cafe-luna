import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BUCKET = "memory-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

const fromB64 = (value: string) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

function matchesImageSignature(bytes: Uint8Array, contentType: string) {
  const startsWith = (sig: number[]) => sig.every((byte, i) => bytes[i] === byte);
  if (contentType === "image/jpeg") return startsWith([0xff, 0xd8, 0xff]);
  if (contentType === "image/png") return startsWith([0x89, 0x50, 0x4e, 0x47]);
  if (contentType === "image/webp") {
    return startsWith([0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45;
  }
  return false;
}

function readText(value: unknown, field: string, maxLength: number, required: boolean) {
  const text = typeof value === "string" ? value.trim() : "";
  if (required && !text) throw new HttpError(400, `${field} را وارد کنید.`);
  if (text.length > maxLength) throw new HttpError(400, `${field} بیش از حد طولانی است.`);
  return text;
}

function readImage(image: unknown) {
  const input = image as { base64?: unknown; contentType?: unknown } | null;
  if (!input || typeof input.base64 !== "string" || typeof input.contentType !== "string") {
    throw new HttpError(400, "لطفاً یک عکس انتخاب کنید.");
  }
  if (!(input.contentType in EXTENSIONS)) {
    throw new HttpError(400, "فقط عکس‌های JPG، PNG یا WEBP مجاز هستند.");
  }
  let bytes: Uint8Array;
  try {
    bytes = fromB64(input.base64);
  } catch {
    throw new HttpError(400, "فایل عکس نامعتبر است.");
  }
  if (bytes.length > MAX_IMAGE_BYTES) throw new HttpError(400, "حجم عکس نباید بیش از ۵ مگابایت باشد.");
  if (!matchesImageSignature(bytes, input.contentType)) {
    throw new HttpError(400, "محتوای فایل با نوع آن مطابقت ندارد.");
  }
  return { bytes, contentType: input.contentType };
}

async function isEnabled() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("memories_enabled")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data?.memories_enabled === true;
}

async function submitMemory(body: Record<string, unknown>) {
  if (!(await isEnabled())) throw new HttpError(403, "بخش خاطره‌ها در حال حاضر فعال نیست.");

  const customerName = readText(body.customer_name, "نام", 60, true);
  const caption = readText(body.caption, "کپشن", 200, false);
  if (body.consent_confirmed !== true) {
    throw new HttpError(400, "برای ثبت خاطره، تأیید کنید که رضایت افراد حاضر در عکس را دارید.");
  }
  const { bytes, contentType } = readImage(body.image);

  const path = `${crypto.randomUUID()}.${EXTENSIONS[contentType]}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (uploadError) throw uploadError;

  const imageUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("memories").insert({
    customer_name: customerName,
    caption,
    image_url: imageUrl,
    status: "pending",
    consent_confirmed: true,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") throw new HttpError(405, "درخواست نامعتبر است.");
    const body = (await req.json()) as Record<string, unknown>;
    if (body.action !== "submit") throw new HttpError(400, "درخواست نامعتبر است.");
    await submitMemory(body);
    return json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("memories function failed", err);
    return json({ error: "خطای سرور. لطفاً دوباره تلاش کنید." }, 500);
  }
});
