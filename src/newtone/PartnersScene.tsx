import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PARTNERS, PARTNER_GROUPS, type Partner } from './partners';
import { ArrowRight, SplitChars } from './parts';
import { eachFromTo, gsap, scene, useSceneMotion } from './motion';

const PartnerTile: React.FC<{ partner: Partner }> = ({ partner }) => {
  const inner = partner.logo ? (
    <img className="pt__logo" src={partner.logo} alt={partner.name} loading="lazy" decoding="async" />
  ) : (
    <span className="pt__name">{partner.name}</span>
  );
  return partner.url ? (
    <a className="pt__tile" href={partner.url} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <div className="pt__tile">{inner}</div>
  );
};

/** 問い合わせ種別「協賛・パートナー」を事前選択して CONTACT のフォームへ（ContactForm.tsx の CONTACT_TYPE_PARAMS と対応） */
export const SPONSOR_CONTACT_HREF = '/contact?type=sponsor#contact-form';

/**
 * PARTNERS — 協賛企業・学生団体・協力／後援
 * データは partners.ts。グループが空の間は「決定次第掲載します」の枠を出す（架空の名前は出さない）。
 * variant 'teaser'（トップ・ABOUT）：見出し付きの紹介 + 「パートナー一覧を見る」
 * variant 'full'（/partners）：見出しは PageHero に任せ、グループごとの一覧 + 募集ブロック
 */
export const PartnersScene: React.FC<{ variant?: 'teaser' | 'full' }> = ({ variant = 'teaser' }) => {
  const full = variant === 'full';
  const GroupTitle = full ? 'h2' : 'h3';
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, ({ desktop, scope }) => {
    // 1画面に収まれば上端ピンの中で登場 → 静止。収まらなければ入ってくるあいだに完成させて下端でピン
    const s = scene(scope, desktop, { start: 'top 82%', end: 'top 30%' });
    const hasCta = scope.querySelector('.pt__cta') !== null;
    // 一覧ページは縦に長いので、デスクトップでもグループごとに順に現れる（先頭ピンの一括登場にしない）
    if (!desktop || full) {
      if (!full) {
        const head = s.rv('.pt__head', { start: 'top 92%', end: 'top 50%' });
        head.fromTo('.pt .eyebrow', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.2 }, 0);
        eachFromTo(head, '.pt__en .char', { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.05, 0.045);
        eachFromTo(head, ['.pt__ja', '.pt__lead'], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.5, 0.12);
      }
      gsap.utils.toArray<HTMLElement>('.pt__group', scope).forEach((g) => {
        const tl = s.rv(g, { start: 'top 96%', end: 'top 66%' });
        tl.fromTo(g.querySelector('.pt__group-title'), { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.4 }, 0);
        eachFromTo(tl, g.querySelectorAll('.pt__tile'), { opacity: 0, y: 26, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, 0.15, 0.1);
      });
      if (hasCta) s.rv('.pt__cta', { start: 'top 100%', end: 'bottom 100%' }).fromTo('.pt__cta', { opacity: 0, y: 30 }, { opacity: 1, y: 0 }, 0);
      if (full) s.rv('.pt__recruit', { start: 'top 100%', end: 'top 70%' }).fromTo('.pt__recruit', { opacity: 0, y: 40 }, { opacity: 1, y: 0 }, 0);
      s.finish();
      return;
    }
    s.tl
      .fromTo('.pt__head > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, 0)
      .fromTo('.pt__group', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.12 }, 0.2);
    if (hasCta) s.tl.fromTo('.pt__cta', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.25 }, 0.6);
    s.finish();
  });

  return (
    <section id="partners" ref={ref} className={`pt${full ? ' pt--full' : ''}`} aria-labelledby={full ? 'pg-title' : 'pt-title'}>
      {!full && (
      <header className="pt__head">
        <p className="eyebrow">With Partners</p>
        <h2 id="pt-title" className="pt__title">
          <SplitChars className="pt__en" text="PARTNERS" />
          <span className="pt__ja">パートナー</span>
        </h2>
        <p className="pt__lead">NEWTONE 2027 を一緒につくる協賛企業・学生団体などのパートナーを、決定次第こちらでご紹介します。</p>
      </header>
      )}

      <div className="pt__groups">
        {PARTNER_GROUPS.map((g) => {
          const members = PARTNERS.filter((p) => p.group === g.key);
          return (
            <div key={g.key} className="pt__group">
              <GroupTitle className="pt__group-title">
                <span className="pt__group-en">{g.en}</span>
                <span className="pt__group-ja">{g.ja}</span>
              </GroupTitle>
              {members.length ? (
                <div className="pt__grid">
                  {members.map((p) => (
                    <PartnerTile key={p.id} partner={p} />
                  ))}
                </div>
              ) : full ? (
                <div className="pt__grid">
                  <div className="pt__tile pt__tile--ph">
                    <span className="pt__tba">Coming soon</span>
                    <span className="pt__tba-ja">決定次第掲載します</span>
                  </div>
                  <div className="pt__tile pt__tile--ph pt__tile--ghost" aria-hidden="true" />
                  <div className="pt__tile pt__tile--ph pt__tile--ghost" aria-hidden="true" />
                </div>
              ) : (
                <div className="pt__grid">
                  <div className="pt__tile pt__tile--tba">
                    <span className="pt__tba">Coming soon</span>
                    <span className="pt__tba-ja">決定次第掲載します</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {full ? (
        <aside className="pt__recruit" aria-labelledby="pt-recruit-title">
          <p className="eyebrow">Become a Partner</p>
          <h2 id="pt-recruit-title" className="pt__recruit-title">
            協賛・パートナーを募集しています
          </h2>
          <p className="pt__recruit-text">
            NEWTONE 2027 を一緒に盛り上げてくださる企業・団体の皆さまを募集しています。協賛・協力の形はご相談のうえ決めていきますので、まずはお気軽にお問い合わせください。
          </p>
          <Link to={SPONSOR_CONTACT_HREF} className="cta pt__recruit-cta">
            <span>協賛・パートナーについて問い合わせる</span>
            <ArrowRight className="cta__arrow" />
          </Link>
        </aside>
      ) : (
        <p className="pt__cta">
          <Link to="/partners" className="pt__cta-link">
            パートナー一覧を見る
            <ArrowRight className="cta__arrow" />
          </Link>
          <Link to={SPONSOR_CONTACT_HREF} className="pt__cta-link pt__cta-link--sub">
            協賛・パートナーについてのご相談
            <ArrowRight className="cta__arrow" />
          </Link>
        </p>
      )}
    </section>
  );
};
