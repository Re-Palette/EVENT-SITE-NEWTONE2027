import React, { useEffect, useRef, useState } from 'react';
import { SNS } from './site';
import { ScrollTrigger, scrollToEl } from './motion';
import { ArrowRight } from './parts';

/** お問い合わせ種別（api/contact.ts の TYPES と同じ並び・同じ文言にすること） */
export const CONTACT_TYPES = ['出店希望', '協賛・パートナー', '来場について', '取材・メディア', 'その他'] as const;

const MAX = { name: 100, organization: 100, email: 254, phone: 30, message: 2000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const PHONE_RE = /^[0-9+\-() 　]+$/;

type FieldKey = 'type' | 'name' | 'organization' | 'email' | 'phone' | 'message' | 'consent';
type Errors = Partial<Record<FieldKey, string>>;
type Status = 'idle' | 'sending' | 'success' | 'unavailable' | 'error';

interface Values {
  type: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
}

const EMPTY: Values = { type: '', name: '', organization: '', email: '', phone: '', message: '', consent: false };
const ORDER: FieldKey[] = ['type', 'name', 'organization', 'email', 'phone', 'message', 'consent'];
/** 先頭にフォーカスを送る要素の id（種別は最初のラジオ） */
const FOCUS_ID: Record<FieldKey, string> = {
  type: 'cf-type-0',
  name: 'cf-name',
  organization: 'cf-organization',
  email: 'cf-email',
  phone: 'cf-phone',
  message: 'cf-message',
  consent: 'cf-consent',
};

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.type) e.type = 'お問い合わせ種別を選んでください。';
  const name = v.name.trim();
  if (!name) e.name = 'お名前を入力してください。';
  else if (name.length > MAX.name) e.name = `お名前は${MAX.name}文字以内で入力してください。`;
  if (v.organization.trim().length > MAX.organization) e.organization = `所属・ブランド名は${MAX.organization}文字以内で入力してください。`;
  const email = v.email.trim();
  if (!email) e.email = 'メールアドレスを入力してください。';
  else if (email.length > MAX.email || !EMAIL_RE.test(email)) e.email = 'メールアドレスの形式が正しくありません（例：name@example.com）。';
  const phone = v.phone.trim();
  if (phone && (phone.length > MAX.phone || !PHONE_RE.test(phone) || !/\d/.test(phone)))
    e.phone = '電話番号は数字と + - ( ) のみ、30文字以内で入力してください。';
  const msg = v.message.trim();
  if (!msg) e.message = 'お問い合わせ内容を入力してください。';
  else if (v.message.length > MAX.message) e.message = `お問い合わせ内容は${MAX.message}文字以内で入力してください。`;
  if (!v.consent) e.consent = '個人情報の取り扱いへの同意が必要です。';
  return e;
}

const Req: React.FC<{ required?: boolean }> = ({ required }) => (
  <span className={`cf__tag${required ? ' cf__tag--req' : ''}`}>{required ? '必須' : '任意'}</span>
);

const FieldError: React.FC<{ id: string; msg?: string }> = ({ id, msg }) =>
  msg ? (
    <p id={id} className="cf__error" role="alert">
      {msg}
    </p>
  ) : null;

/**
 * 参加・お問い合わせフォーム（CONTACT ページ）。POST /api/contact（api/contact.ts）。
 * 背の高いフォームなのでピン留めはしない。各グループがスクロールに合わせて薄く現れるだけ（視差効果を減らす設定では何もしない）。
 */
export const ContactForm: React.FC = () => {
  const root = useRef<HTMLElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const renderedAt = useRef(Date.now());
  const sending = useRef(false);
  const [v, setV] = useState<Values>(EMPTY);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');

  // フォームは入力の邪魔をしないよう、出現アニメーションを付けない（常に完成形で表示）

  // 高さが変わる（エラー表示・完了表示）ので、後ろの場面のピン位置を取り直す
  const errorCount = Object.keys(errors).length;
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [status, errorCount]);

  useEffect(() => {
    if (status === 'success' && doneRef.current) {
      doneRef.current.focus({ preventScroll: true });
      // 見出しごと見える位置へ（ヘッダーに隠れないよう、余白を含むセクションの先頭に合わせる）
      if (root.current) scrollToEl(root.current);
    }
  }, [status]);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    if (errors[k as FieldKey])
      setErrors((p) => {
        const next = { ...p };
        delete next[k as FieldKey];
        return next;
      });
  };

  const focusFirst = (e: Errors) => {
    const first = ORDER.find((k) => e[k]);
    if (first) document.getElementById(FOCUS_ID[first])?.focus();
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (sending.current) return;
    const e = validate(v);
    setErrors(e);
    if (Object.keys(e).length) {
      focusFirst(e);
      return;
    }
    sending.current = true;
    setStatus('sending');
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          type: v.type,
          name: v.name.trim(),
          organization: v.organization.trim(),
          email: v.email.trim(),
          phone: v.phone.trim(),
          message: v.message.trim(),
          consent: v.consent,
          website: honeypot,
          // 表示してから送信するまでの経過ミリ秒（短すぎる送信＝bot を判定。端末の時計のずれに左右されない）
          elapsedMs: Date.now() - renderedAt.current,
        }),
      });
      if (res.ok) setStatus('success');
      else if (res.status === 503) setStatus('unavailable');
      else setStatus('error');
    } catch {
      setStatus('error');
    } finally {
      window.clearTimeout(timer);
      sending.current = false;
    }
  };

  const reset = () => {
    setV(EMPTY);
    setErrors({});
    setStatus('idle');
    renderedAt.current = Date.now();
  };

  const insta = SNS.find((s) => s.key === 'instagram') ?? SNS[0];
  const busy = status === 'sending';
  const desc = (k: FieldKey, extra = '') => {
    const ids = [errors[k] ? `cf-${k}-err` : '', extra].filter(Boolean).join(' ');
    return ids || undefined;
  };

  return (
    <section id="contact-form" ref={root} className="cf" aria-labelledby="cf-title">
      <div className="cf__inner">
        <p className="eyebrow">Contact Form</p>
        <h2 id="cf-title" className="cf__title">
          お問い合わせフォーム
        </h2>

        {status === 'success' ? (
          <div ref={doneRef} className="cf__card cf__done" role="status" tabIndex={-1}>
            <span className="cf__done-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <h3 className="cf__done-title">送信が完了しました</h3>
            <p className="cf__done-text">
              お問い合わせありがとうございます。内容を確認のうえ、ご入力のメールアドレス宛に NEWTONE 2027 運営よりご連絡します。
              <br />
              ご返信までに数日いただく場合があります。あらかじめご了承ください。
            </p>
            <button type="button" className="cf__ghost" onClick={reset}>
              別のお問い合わせを送る
            </button>
          </div>
        ) : (
          <form className="cf__card" onSubmit={onSubmit} noValidate aria-busy={busy}>
            <p className="cf__note">
              <span className="cf__tag cf__tag--req">必須</span> の項目は必ずご入力ください。
            </p>

            <fieldset className="cf__group cf__fieldset" aria-describedby={desc('type')}>
              <legend className="cf__label">
                お問い合わせ種別 <Req required />
              </legend>
              <div className="cf__chips">
                {CONTACT_TYPES.map((t, i) => (
                  <label key={t} className="cf__chip">
                    <input
                      id={`cf-type-${i}`}
                      type="radio"
                      name="type"
                      value={t}
                      checked={v.type === t}
                      onChange={() => set('type', t)}
                      required
                      aria-invalid={errors.type ? true : undefined}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
              <FieldError id="cf-type-err" msg={errors.type} />
            </fieldset>

            <div className="cf__group">
              <label className="cf__label" htmlFor="cf-name">
                お名前 <Req required />
              </label>
              <input
                id="cf-name"
                className="cf__input"
                name="name"
                type="text"
                autoComplete="name"
                maxLength={MAX.name + 20}
                value={v.name}
                onChange={(e) => set('name', e.target.value)}
                aria-required="true"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={desc('name')}
              />
              <FieldError id="cf-name-err" msg={errors.name} />
            </div>

            <div className="cf__group">
              <label className="cf__label" htmlFor="cf-organization">
                所属・ブランド名 <Req />
              </label>
              <input
                id="cf-organization"
                className="cf__input"
                name="organization"
                type="text"
                autoComplete="organization"
                value={v.organization}
                onChange={(e) => set('organization', e.target.value)}
                aria-invalid={errors.organization ? true : undefined}
                aria-describedby={desc('organization')}
              />
              <FieldError id="cf-organization-err" msg={errors.organization} />
            </div>

            <div className="cf__row">
              <div className="cf__group">
                <label className="cf__label" htmlFor="cf-email">
                  メールアドレス <Req required />
                </label>
                <input
                  id="cf-email"
                  className="cf__input"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={v.email}
                  onChange={(e) => set('email', e.target.value)}
                  aria-required="true"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={desc('email')}
                />
                <FieldError id="cf-email-err" msg={errors.email} />
              </div>
              <div className="cf__group">
                <label className="cf__label" htmlFor="cf-phone">
                  電話番号 <Req />
                </label>
                <input
                  id="cf-phone"
                  className="cf__input"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={v.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={desc('phone')}
                />
                <FieldError id="cf-phone-err" msg={errors.phone} />
              </div>
            </div>

            <div className="cf__group">
              <label className="cf__label" htmlFor="cf-message">
                お問い合わせ内容 <Req required />
              </label>
              <textarea
                id="cf-message"
                className="cf__input cf__textarea"
                name="message"
                rows={7}
                maxLength={MAX.message}
                value={v.message}
                onChange={(e) => set('message', e.target.value)}
                data-lenis-prevent
                aria-required="true"
                aria-invalid={errors.message ? true : undefined}
                aria-describedby={desc('message', 'cf-message-count')}
              />
              <div className="cf__foot">
                <FieldError id="cf-message-err" msg={errors.message} />
                <p id="cf-message-count" className={`cf__count${v.message.length >= MAX.message - 100 ? ' is-near' : ''}`}>
                  {v.message.length} / {MAX.message}
                </p>
              </div>
            </div>

            {/* ボット対策（人には見えない・操作できない） */}
            <div className="cf__hp" aria-hidden="true">
              <label>
                Website
                <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
              </label>
            </div>

            <div className="cf__group cf__consent">
              <label className="cf__check" htmlFor="cf-consent">
                <input
                  id="cf-consent"
                  type="checkbox"
                  name="consent"
                  checked={v.consent}
                  onChange={(e) => set('consent', e.target.checked)}
                  aria-required="true"
                  aria-invalid={errors.consent ? true : undefined}
                  aria-describedby={desc('consent')}
                />
                <span className="cf__box" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                <span>
                  個人情報の取り扱いに同意します <Req required />
                </span>
              </label>
              <FieldError id="cf-consent-err" msg={errors.consent} />
              <details className="cf__details">
                <summary>個人情報の取り扱いについて</summary>
                <ul>
                  <li>ご入力いただいた情報は、お問い合わせへの返信と、本イベントに関するご連絡のためにのみ利用します。</li>
                  <li>法令に基づく場合を除き、ご本人の同意なく第三者へ提供しません。</li>
                  <li>情報の削除をご希望の場合は、NEWTONE 2027 運営までご連絡ください。</li>
                </ul>
                <p>取扱主体：NEWTONE 2027 運営</p>
              </details>
            </div>

            {status === 'unavailable' && (
              <div className="cf__alert" role="alert">
                <p>現在フォームからの送信を受け付けられません。お手数ですがInstagramのDMからご連絡ください。</p>
                {insta && (
                  <a href={insta.url} target="_blank" rel="noopener noreferrer">
                    {insta.label} {insta.handle}（新しいタブで開きます）
                  </a>
                )}
              </div>
            )}
            {status === 'error' && (
              <div className="cf__alert" role="alert">
                <p>送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。</p>
              </div>
            )}
            {errorCount > 0 && status !== 'error' && status !== 'unavailable' && (
              <p className="cf__summary" role="alert">
                入力内容に {errorCount} 件の確認が必要な項目があります。
              </p>
            )}

            <button type="submit" className="cta cta--main cf__submit" aria-disabled={busy}>
              <span>{busy ? '送信中…' : '送信する'}</span>
              {busy ? <span className="cf__spinner" aria-hidden="true" /> : <ArrowRight className="cta__arrow" />}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
