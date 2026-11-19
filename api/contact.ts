/**
 * POST /api/contact — お問い合わせフォームの受け口（Vercel Serverless Function / Node.js）。
 * Resend の REST API でメールを送る。環境変数（値は Vercel の Environment Variables に設定。コードに書かない）:
 *   RESEND_API_KEY       Resend の API キー
 *   CONTACT_TO_EMAIL     通知の宛先（カンマ区切りで複数可）
 *   CONTACT_FROM_EMAIL   送信元（省略時: 'NEWTONE 2027 <onboarding@resend.dev>'）
 * 詳しくは docs/contact-form.md。
 */

/** 使う範囲だけの最小の型（@vercel/node は入れない） */
interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}
interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): unknown;
}

/** src/newtone/ContactForm.tsx の CONTACT_TYPES と同じ */
const TYPES = ['出店希望', '協賛・パートナー', '来場について', '取材・メディア', 'その他'];
const MAX = { name: 100, organization: 100, email: 254, phone: 30, message: 2000 };
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const PHONE_RE = /^[0-9+\-() 　]+$/;
/** 表示してから送信までの最短時間（これより速い＝bot とみなして黙って捨てる） */
const MIN_ELAPSED_MS = 3000;
const DEFAULT_FROM = 'NEWTONE 2027 <onboarding@resend.dev>';

/**
 * 簡易レート制限（IP ごとに 10 分で 5 回）。
 * メモリ上なので「関数インスタンスごと」の best-effort（コールドスタートや並列インスタンスでは共有されない）。
 */
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 1000) for (const [k, ts] of hits) if (ts.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
  return false;
}

const header = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

function clientIp(req: Req): string {
  const xff = header(req.headers['x-forwarded-for']).split(',')[0]?.trim();
  return xff || header(req.headers['x-real-ip']) || req.socket?.remoteAddress || 'unknown';
}

/** ヘッダーに入る値から改行・制御文字を除く（ヘッダーインジェクション対策） */
const oneLine = (s: string) => s.replace(/[\x00-\x1f\x7f\s]+/g, ' ').trim();

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const str = (v: unknown) => (typeof v === 'string' ? v : '');

function parseBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toList = (process.env.CONTACT_TO_EMAIL ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || toList.length === 0) {
    res.status(503).json({ error: 'not_configured' });
    return;
  }

  const data = parseBody(req.body);
  if (!data) {
    res.status(400).json({ error: 'invalid_body' });
    return;
  }

  // ボット対策：ハニーポットが埋まっている／表示から 3 秒未満の送信は、成功を装って何も送らない
  const elapsed = typeof data.elapsedMs === 'number' ? data.elapsedMs : NaN;
  if (str(data.website) !== '' || !Number.isFinite(elapsed) || elapsed < MIN_ELAPSED_MS) {
    res.status(200).json({ ok: true });
    return;
  }

  const type = str(data.type);
  const name = str(data.name).trim();
  const organization = str(data.organization).trim();
  const email = str(data.email).trim();
  const phone = str(data.phone).trim();
  const message = str(data.message).trim();

  const fields: Record<string, string> = {};
  if (!TYPES.includes(type)) fields.type = 'invalid';
  if (!name || name.length > MAX.name) fields.name = 'invalid';
  if (organization.length > MAX.organization) fields.organization = 'invalid';
  if (!email || email.length > MAX.email || !EMAIL_RE.test(email)) fields.email = 'invalid';
  if (phone && (phone.length > MAX.phone || !PHONE_RE.test(phone) || !/\d/.test(phone))) fields.phone = 'invalid';
  if (!message || message.length > MAX.message) fields.message = 'invalid';
  if (data.consent !== true) fields.consent = 'required';
  if (Object.keys(fields).length > 0) {
    res.status(400).json({ error: 'validation', fields });
    return;
  }

  if (rateLimited(clientIp(req), Date.now())) {
    res.setHeader('Retry-After', String(RATE_WINDOW_MS / 1000));
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const subject = oneLine(`【NEWTONE 2027 お問い合わせ】${type} ${name}様`);
  const lines: [string, string][] = [
    ['お問い合わせ種別', type],
    ['お名前', name],
    ['所属・ブランド名', organization || '（未入力）'],
    ['メールアドレス', email],
    ['電話番号', phone || '（未入力）'],
  ];
  const text = [...lines.map(([k, v]) => `${k}: ${v}`), '', '■ お問い合わせ内容', message, '', '--', 'NEWTONE 2027 公式サイトのお問い合わせフォームから送信されました。'].join('\n');
  const html =
    `<div style="font-family:sans-serif;line-height:1.7;color:#111">` +
    `<table style="border-collapse:collapse">${lines
      .map(([k, v]) => `<tr><th align="left" style="padding:4px 16px 4px 0;white-space:nowrap">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
      .join('')}</table>` +
    `<h3 style="margin:20px 0 6px">お問い合わせ内容</h3>` +
    `<div style="white-space:pre-wrap">${escapeHtml(message)}</div>` +
    `<p style="margin-top:24px;color:#666;font-size:12px">NEWTONE 2027 公式サイトのお問い合わせフォームから送信されました。</p></div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: oneLine(process.env.CONTACT_FROM_EMAIL || DEFAULT_FROM),
        to: toList,
        reply_to: oneLine(email),
        subject,
        text,
        html,
      }),
    });
    if (!r.ok) {
      // 個人情報を含めない（ステータスのみ）
      console.error('[contact] resend failed', r.status);
      res.status(502).json({ error: 'send_failed' });
      return;
    }
  } catch {
    console.error('[contact] resend request error');
    res.status(502).json({ error: 'send_failed' });
    return;
  }

  res.status(200).json({ ok: true });
}
