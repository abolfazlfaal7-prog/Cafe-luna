import { supabase, supabaseAnonHeaders, supabaseFunctionsUrl } from '@/lib/supabase';
import type { ImagePayload } from '@/lib/adminApi';
import type { PublicMemory } from '@/types/memory';

const GENERIC_ERROR = 'ثبت خاطره انجام نشد. لطفاً دوباره تلاش کنید.';

export type PublicMemoriesState = { enabled: boolean; memories: PublicMemory[] };

export async function fetchPublicMemories(): Promise<PublicMemoriesState> {
  const [settings, memories] = await Promise.all([
    supabase.from('site_settings').select('memories_enabled').eq('id', 1).maybeSingle(),
    supabase
      .from('memories')
      .select('id, customer_name, caption, image_url, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false }),
  ]);
  if (settings.error) throw settings.error;
  if (memories.error) throw memories.error;
  return {
    enabled: settings.data?.memories_enabled === true,
    memories: memories.data ?? [],
  };
}

export type MemorySubmission = {
  customerName: string;
  caption: string;
  consentConfirmed: boolean;
  image: ImagePayload;
};

export async function submitMemory(submission: MemorySubmission): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${supabaseFunctionsUrl}/memories`, {
      method: 'POST',
      headers: { ...supabaseAnonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        customer_name: submission.customerName,
        caption: submission.caption,
        consent_confirmed: submission.consentConfirmed,
        image: submission.image,
      }),
    });
  } catch {
    throw new Error('اتصال به سرور برقرار نشد. اینترنت خود را بررسی کنید.');
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = (data as { error?: unknown } | null)?.error;
    throw new Error(typeof message === 'string' ? message : GENERIC_ERROR);
  }
}
