import React, { useRef } from 'react';
import { BRANDS, BRAND_PLACEHOLDER_COUNT, type Brand } from './brands';
import { Phrases } from './parts';
import { eachFromTo, gsap, parallax, SCRUB, scene, useSceneMotion } from './motion';

const HUES = ['#ff4fa3', '#a35cf0', '#4f6dff', '#e46bff', '#7f93f6'];
const pad = (n: number) => String(n).padStart(2, '0');

const BrandCard: React.FC<{ brand: Brand; index: number }> = ({ brand, index }) => {
  const body = (
    <>
      {brand.image && <img className="br__img" src={brand.image} alt="" loading="lazy" decoding="async" />}
      <span className="br__no" aria-hidden="true">
        {pad(index + 1)}
      </span>
      <span className="br__meta">
        {brand.category && <span className="br__cat">{brand.category}</span>}
        {brand.logo ? <img className="br__logo" src={brand.logo} alt={brand.name} loading="lazy" /> : <span className="br__name">{brand.name}</span>}
        <span className="br__concept">{brand.concept}</span>
      </span>
    </>
  );
  return brand.url ? (
    <a className="br__card br__card--live" href={brand.url} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <div className="br__card br__card--live">{body}</div>
  );
};

const PlaceholderCard: React.FC<{ index: number }> = ({ index }) => (
  <div className="br__card br__card--soon">
    <span className="br__sheen" aria-hidden="true" />
    <span className="br__tag" aria-hidden="true">
      BRAND
    </span>
    <span className="br__no" aria-hidden="true">
      {pad(index + 1)}
    </span>
    <span className="br__soon">Coming soon</span>
    <span className="br__soon-ja">近日公開</span>
  </div>
);

/**
 * SCENE 05 — BRANDS
 * brands.ts の内容をそのまま並べる。未登録の間は COMING SOON の枠だけを見せる。
 */
export const BrandsScene: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const hasBrands = BRANDS.length > 0;
  const count = hasBrands ? BRANDS.length : BRAND_PLACEHOLDER_COUNT;

  useSceneMotion(ref, ({ desktop, scope }) => {
    // 一覧は1画面を超えるので、要素は画面に入るあいだに完成させ、下端でピンして最後の段を静止して見せる
    // （全体が1画面に収まる環境なら、上端ピンの中で順に登場する）
    const s = scene(scope, desktop);
    if (!desktop) {
      // 見出し：LINEUP が1文字ずつせり上がり、続けて日本語と本文が現れる（スクロール同期）
      const head = s.rv('.br__head', { start: 'top 92%', end: 'top 50%' });
      head.fromTo('.br .eyebrow', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.2 }, 0);
      eachFromTo(head, '.br__en .char', { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }, 0.05, 0.07);
      eachFromTo(head, ['.br__ja', '.br__lead'], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3 }, 0.5, 0.12);
      // カード：左右交互に少し傾いたまま入り、拡大しながら定位置へ
      gsap.utils.toArray<HTMLElement>('.br__item', scope).forEach((item, i) => {
        // トリガー（li）自体は動かさず、中のカードを動かす（トリガー位置がずれないように）
        s.rv(item, { start: 'top 98%', end: 'top 70%' }).fromTo(
          item.firstElementChild,
          { opacity: 0, y: 56, x: i % 2 ? 14 : -14, scale: 0.94, rotate: i % 2 ? 2 : -2 },
          { opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 },
          0,
        );
      });
      if (!s.fit) parallax('.br__bg', scope, { yPercent: -5 }, { yPercent: 5 }, 'bottom bottom');
      s.finish();
      return;
    }
    if (s.fit) {
      s.tl
        .fromTo('.br .eyebrow', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3 }, 0)
        .fromTo('.br__en .char', { yPercent: 105 }, { yPercent: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' }, 0)
        .fromTo(['.br__ja', '.br__lead'], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.12 }, 0.45)
        .fromTo('.br__item', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.06 }, 0.7);
      s.finish();
      return;
    }
    gsap
      .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.br__head', start: 'top 88%', end: 'top 35%', scrub: SCRUB, invalidateOnRefresh: true } })
      .fromTo('.br .eyebrow', { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3 }, 0)
      .fromTo('.br__en .char', { yPercent: 105 }, { yPercent: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out' }, 0)
      .fromTo(['.br__ja', '.br__lead'], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.12 }, 0.45);

    // 列ごとに速度を変えて、縦にずれながら流れる。下端ピンで止まるときには、すべて定位置に収まっている
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: '.br__grid', start: 'top bottom', end: 'bottom bottom', scrub: SCRUB, invalidateOnRefresh: true },
      })
      .fromTo('.br__item:nth-child(odd)', { y: 60 }, { y: 0, duration: 1 }, 0)
      .fromTo('.br__item:nth-child(even)', { y: 130 }, { y: 0, duration: 1 }, 0)
      .fromTo('.br__item', { opacity: 0 }, { opacity: 1, duration: 0.2, stagger: 0.03 }, 0.04);
    s.finish();
  });

  return (
    <section id="brands" ref={ref} className="br" aria-labelledby="br-title">
      <div className="br__bg" aria-hidden="true" />
      <header className="br__head">
        <p className="eyebrow">04 — Brands</p>
        <h2 id="br-title" className="br__title">
          <span className="br__en" aria-hidden="true">
            {Array.from('LINEUP').map((ch, i) => (
              <span className="char" key={i}>
                {ch}
              </span>
            ))}
          </span>
          <span className="br__ja">
            <Phrases text="次の定番は、|ここから生まれる。" />
          </span>
        </h2>
        <p className="br__lead">
          {hasBrands ? (
            <>学生起業家や若きクリエイターが手がけるブランドが、NEWTONE に集まります。</>
          ) : (
            <>
              出展ブランドは、決定次第こちらで順次公開します。
              <br />
              どんな出会いが待っているか、楽しみにお待ちください。
            </>
          )}
        </p>
      </header>

      <ul className="br__grid" style={{ ['--cols' as string]: Math.min(count, 5) }}>
        {hasBrands
          ? BRANDS.map((b, i) => (
              <li key={b.id} className="br__item" style={{ ['--hue' as string]: HUES[i % HUES.length] }}>
                <BrandCard brand={b} index={i} />
              </li>
            ))
          : Array.from({ length: count }, (_, i) => (
              <li key={i} className="br__item" style={{ ['--hue' as string]: HUES[i % HUES.length], ['--i' as string]: i }}>
                <PlaceholderCard index={i} />
              </li>
            ))}
      </ul>
    </section>
  );
};
