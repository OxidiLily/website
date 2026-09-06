// Klien AI agent untuk panel admin.
//
// Kunci API disimpan di tabel `settings`, yang TIDAK punya policy baca untuk
// anon (lihat supabase/schema.sql) — jadi hanya admin yang terautentikasi bisa
// mengambilnya. Panggilan tetap terjadi dari browser admin: SPA ini tidak punya
// sisi server untuk mem-proxy. Konsekuensinya jujur disebut di UI Pengaturan:
// jangan pakai kunci berkuota tak terbatas di sini, dan asisten AI PUBLIK
// sengaja tidak memakai konfigurasi ini sama sekali.
import { supabase } from './supabase';

export interface AiConfig {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  greeting: string;
}

export const AI_KEYS = [
  'ai_enabled',
  'ai_endpoint',
  'ai_api_key',
  'ai_model',
  'ai_system_prompt',
  'ai_greeting',
] as const;

export async function loadAiConfig(): Promise<AiConfig> {
  const { data } = await supabase.from('settings').select('key, value').in('key', AI_KEYS as unknown as string[]);
  const m = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? '']));
  return {
    enabled: m.ai_enabled === '1',
    endpoint: m.ai_endpoint ?? '',
    apiKey: m.ai_api_key ?? '',
    model: m.ai_model ?? '',
    systemPrompt: m.ai_system_prompt ?? '',
    greeting: m.ai_greeting ?? '',
  };
}

/** Origin yang diizinkan CSP untuk dihubungi (connect-src). */
export function cspAllowsOrigin(endpoint: string): boolean {
  try {
    const origin = new URL(endpoint).origin;
    const allowed = (import.meta.env.VITE_AI_ORIGIN || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);
    return allowed.includes(origin) || origin === window.location.origin;
  } catch {
    return false;
  }
}

export class AiError extends Error {}

/**
 * Satu panggilan chat completion format OpenAI-compatible (dipakai 9router,
 * OpenAI, DeepSeek, dan sebagian besar gateway lokal).
 */
export async function aiComplete(
  cfg: AiConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  if (!cfg.endpoint) throw new AiError('Endpoint AI belum diisi.');
  if (!cfg.apiKey) throw new AiError('API key AI belum diisi.');
  if (!cspAllowsOrigin(cfg.endpoint)) {
    throw new AiError(
      `Origin ${new URL(cfg.endpoint).origin} tidak ada di Content-Security-Policy. ` +
        'Tambahkan ke VITE_AI_ORIGIN di .env lalu build ulang — tanpa itu browser memblokir permintaannya.',
    );
  }

  let res: Response;
  try {
    res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.model || undefined,
        messages,
        max_tokens: opts.maxTokens ?? 2048,
        temperature: opts.temperature ?? 0.7,
        stream: false,
      }),
    });
  } catch (e: any) {
    // fetch gagal tanpa status = jaringan, CORS, atau CSP.
    throw new AiError(`Tidak bisa menghubungi endpoint (jaringan/CORS/CSP): ${e?.message ?? e}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AiError(`HTTP ${res.status} — ${body.slice(0, 200)}`);
  }

  const json = await res.json().catch(() => null);
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new AiError('Respons tidak berisi choices[0].message.content.');
  return content as string;
}
