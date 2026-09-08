// Klien AI agent untuk panel admin.
//
// Kunci API disimpan di tabel `settings`, yang TIDAK punya policy baca untuk
// anon (lihat supabase/schema.sql) — jadi hanya admin yang terautentikasi bisa
// mengambilnya. Panggilan tetap terjadi dari browser admin: SPA ini tidak punya
// sisi server untuk mem-proxy. Konsekuensinya jujur disebut di UI Pengaturan:
// jangan pakai kunci berkuota tak terbatas di sini, dan asisten AI PUBLIK
// sengaja tidak memakai konfigurasi ini sama sekali.

/**
 * Bentuk kabel yang dipakai gateway. BUKAN nama vendor.
 *
 * `openai` dipahami 9router, OpenRouter, DeepSeek, Ollama, LM Studio, vLLM,
 * Groq, Together — praktis semua yang menyebut dirinya OpenAI-compatible.
 * `anthropic` hanya perlu dipilih untuk api.anthropic.com sendiri atau gateway
 * yang sengaja diakses lewat jalur /v1/messages-nya; header auth, letak system
 * prompt, dan bentuk responsnya semuanya berbeda, jadi tidak bisa ditebak dari
 * URL-nya.
 */
export type AiFormat = 'openai' | 'anthropic';

export interface AiConfig {
  enabled: boolean;
  endpoint: string;
  format: AiFormat;
  apiKey: string;
  model: string;
  systemPrompt: string;
  greeting: string;
}

export const AI_KEYS = [
  'ai_enabled',
  'ai_endpoint',
  'ai_format',
  'ai_api_key',
  'ai_model',
  'ai_system_prompt',
  'ai_greeting',
] as const;


export async function loadAiConfig(): Promise<AiConfig> {
  // Klien Supabase diimpor saat dipanggil, bukan di kepala modul: `aiUrl()` di
  // bawah adalah logika string murni, dan menariknya lewat impor statis membuat
  // seluruh berkas ini mustahil dijalankan di luar browser — termasuk oleh
  // ai.check.ts, karena createClient() dieksekusi saat modul dimuat dan membaca
  // window/import.meta.env yang tidak ada di node.
  const { supabase } = await import('./supabase');
  const { data } = await supabase.from('settings').select('key, value').in('key', AI_KEYS as unknown as string[]);
  const m = Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value ?? '']));
  return {
    enabled: m.ai_enabled === '1',
    endpoint: m.ai_endpoint ?? '',
    format: m.ai_format === 'anthropic' ? 'anthropic' : 'openai',
    apiKey: m.ai_api_key ?? '',
    model: m.ai_model ?? '',
    systemPrompt: m.ai_system_prompt ?? '',
    greeting: m.ai_greeting ?? '',
  };
}

/**
 * base_url → URL request penuh.
 *
 * Yang diisi admin adalah base_url seperti yang tertulis di dokumentasi tiap
 * penyedia (`https://api.openai.com/v1`, `https://openrouter.ai/api/v1`,
 * `https://api.deepseek.com`, `http://localhost:11434/v1`, `/ai/v1` untuk
 * gateway lokal lewat proxy situs ini), bukan jalur endpointnya. Menyuruh
 * admin menempelkan `/chat/completions` sendiri adalah cara paling sering
 * salah ketik: `/v1` saja menjawab 404, dan 404 dari gateway tidak bisa
 * dibedakan dari gateway yang mati.
 *
 * Endpoint lengkap TETAP diterima apa adanya supaya nilai yang sudah tersimpan
 * di tabel `settings` tidak berubah arti setelah kode ini tayang.
 */
export function aiUrl(endpoint: string, format: AiFormat): string {
  const base = endpoint.trim().replace(/\/+$/, '');
  if (/\/(chat\/completions|messages)$/.test(base)) return base;
  // Anthropic menaruh versinya di jalur, bukan di base_url — dokumentasinya
  // menulis `https://api.anthropic.com`. `/v1` yang terlanjur diketik dibuang
  // supaya tidak jadi `/v1/v1/messages`.
  if (format === 'anthropic') return `${base.replace(/\/v1$/, '')}/v1/messages`;
  // base_url OpenAI-compatible sudah memuat versinya (`/v1`, kadang `/v4`).
  // Yang tidak memuatnya — `http://ai.home:20128` — dilengkapi di sini.
  return /\/v\d+$/.test(base) ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
}

/**
 * Boleh dipanggil dari halaman PUBLIK?
 *
 * Hanya jalur se-origin (`/ai/v1`), tidak pernah URL absolut. Alasannya kunci:
 * di jalur se-origin kuncinya disuntikkan server penyaji (lihat blok `/ai` di
 * vite.config.ts) dan tidak pernah ikut ke browser pengunjung. URL absolut
 * berarti browser pengunjung sendiri yang harus membawa kunci — dan kunci itu
 * hanya terbaca admin (RLS menutup `ai_api_key` untuk anon), jadi permintaannya
 * pasti 401 sekaligus membocorkan kunci kalau sampai dibuka.
 */
export const bolehDipakaiPublik = (endpoint: string): boolean => endpoint.trim().startsWith('/');

/**
 * Origin yang diizinkan CSP untuk dihubungi (connect-src).
 *
 * `window.location.origin` sebagai basis membuat jalur relatif — `/ai/v1/...`,
 * yang diproksikan vite.config.ts — dinilai se-origin, jadi lolos lewat
 * `'self'`. Tanpa basis itu `new URL()` melempar untuk setiap jalur relatif dan
 * endpoint proxy yang benar justru dilaporkan sebagai diblokir CSP.
 */
export function cspAllowsOrigin(endpoint: string): boolean {
  try {
    const origin = new URL(endpoint, window.location.origin).origin;
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
 * Satu panggilan chat, dalam bentuk kabel yang dipilih di `cfg.format`.
 *
 * Perbedaan antara kedua bentuk bukan cuma nama header:
 *  - auth      : `Authorization: Bearer` vs `x-api-key` + `anthropic-version`
 *  - system    : satu pesan berperan `system` vs field `system` di akar body
 *  - max_tokens: opsional vs WAJIB (Anthropic menolak body tanpa itu)
 *  - jawaban   : `choices[0].message.content` vs blok teks pertama di `content`
 * Karena itu formatnya dipilih admin, tidak ditebak dari URL.
 */
export async function aiComplete(
  cfg: AiConfig,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  opts: { maxTokens?: number; temperature?: number } = {},
): Promise<string> {
  if (!cfg.endpoint) throw new AiError('Endpoint AI belum diisi.');

  const url = aiUrl(cfg.endpoint, cfg.format);
  // Kunci kosong sah HANYA di jalur se-origin: di situ server penyaji yang
  // menyuntikkannya. Untuk endpoint lintas-origin, kunci kosong berarti 401
  // yang membingungkan, jadi dihentikan di sini dengan sebabnya.
  if (!cfg.apiKey && !bolehDipakaiPublik(cfg.endpoint)) {
    throw new AiError('API key AI belum diisi.');
  }
  if (!cspAllowsOrigin(url)) {
    throw new AiError(
      `Origin ${new URL(url, window.location.origin).origin} tidak ada di Content-Security-Policy. ` +
        'Pakai jalur proxy /ai/v1, atau tambahkan origin-nya ke VITE_AI_ORIGIN di .env lalu build ulang.',
    );
  }

  const anthropic = cfg.format === 'anthropic';
  const maxTokens = opts.maxTokens ?? 2048;
  const temperature = opts.temperature ?? 0.7;

  // Anthropic tidak mengenal pesan berperan `system`; ia menolak body yang
  // memuatnya. Isinya dipindah ke field `system` — digabung, karena pemanggil
  // boleh mengirim lebih dari satu.
  const sistem = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const percakapan = messages.filter((m) => m.role !== 'system');

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: anthropic
        ? {
            // Kunci kosong → header auth SENGAJA tidak dikirim sama sekali,
            // bukan dikirim kosong: proxy hanya menyuntikkan kuncinya kalau
            // permintaannya belum membawa satu pun.
            ...(cfg.apiKey ? { 'x-api-key': cfg.apiKey } : {}),
            'anthropic-version': '2023-06-01',
            // Tanpa header ini api.anthropic.com menolak SETIAP permintaan yang
            // datang dari browser, apa pun kuncinya. Namanya memang peringatan:
            // kuncinya ikut sampai ke browser admin — batas yang sudah disebut
            // di kepala berkas ini dan di UI Pengaturan.
            'anthropic-dangerous-direct-browser-access': 'true',
            'Content-Type': 'application/json',
          }
        : {
            ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
            'Content-Type': 'application/json',
          },
      body: JSON.stringify(
        anthropic
          ? {
              model: cfg.model || undefined,
              max_tokens: maxTokens,
              temperature,
              // WAJIB, walau `false` adalah default menurut dokumentasi
              // Anthropic: 9router menjawab /v1/messages dengan aliran SSE
              // kalau field ini tidak ada sama sekali, dan res.json() gagal
              // mengurai `event: message_start ...` — terukur, bukan dugaan.
              stream: false,
              ...(sistem ? { system: sistem } : {}),
              messages: percakapan,
            }
          : {
              model: cfg.model || undefined,
              messages,
              max_tokens: maxTokens,
              temperature,
              stream: false,
            },
      ),
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
  const content = anthropic
    ? json?.content?.find((b: any) => b?.type === 'text')?.text
    : json?.choices?.[0]?.message?.content;

  if (!content) {
    // Model reasoning menghabiskan seluruh anggaran token di field `reasoning`
    // sebelum menulis satu huruf pun jawaban; yang balik adalah jawaban kosong
    // dengan alasan berhenti "length", bukan error. Alasannya disebut supaya
    // tidak terbaca sebagai endpoint yang salah.
    const alasan = json?.choices?.[0]?.finish_reason ?? json?.stop_reason;
    throw new AiError(
      alasan === 'length' || alasan === 'max_tokens'
        ? `Model berhenti di batas token (${maxTokens}) sebelum menulis jawaban — naikkan batasnya atau pakai model non-reasoning.`
        : `Respons tidak berisi ${anthropic ? 'content[].text' : 'choices[0].message.content'}.`,
    );
  }
  return content as string;
}
