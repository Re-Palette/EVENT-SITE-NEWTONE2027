import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Particles, SplitChars } from './parts';
import { gsap, isLite, SCRUB, useSceneMotion } from './motion';

const heroBlur = '/newtone/hero-blur.webp';
const waveB = '/newtone/wave-b.webp';

/** 下層ページの見出し。トップの HERO と同じ夜の光の中に、巨大な英字とページ名を置く */
export const PageHero: React.FC<{ en: string; ja: string; lead?: React.ReactNode }> = ({ en, ja, lead }) => {
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, ({ desktop }) => {
    // 表示した瞬間の導入演出
    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .from('.pg-hero__crumbs', { opacity: 0, y: 16, duration: 0.6 }, 0.05)
      .from('.pg-hero__en .char', { yPercent: 105, opacity: 0, duration: 0.9, stagger: 0.045 }, 0.1)
      .from(['.pg-hero__ja', '.pg-hero__lead'], { opacity: 0, y: 24, duration: 0.8, stagger: 0.1 }, 0.45)
      .from('.pg-hero .wave', { opacity: 0, xPercent: 6, duration: 1.6, ease: 'power2.out' }, 0);

    // スマホ：ページを下へ送るあいだ、見出しは少し遅れて薄れ、背景の光は流れる（スクロール同期・上へ戻せば逆再生）
    if (!desktop) {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: SCRUB, invalidateOnRefresh: true },
      });
      tl.fromTo('.pg-hero__inner', { y: 0, opacity: 1 }, { y: -48, opacity: 0.15 }, 0);
      if (!isLite()) tl.fromTo('.pg-hero__bg', { yPercent: 0, scale: 1 }, { yPercent: 12, scale: 1.08 }, 0);
    }
  });

  return (
    <section id="top" ref={ref} className="pg-hero" aria-labelledby="pg-title">
      <div className="pg-hero__bg" style={{ backgroundImage: `url(${heroBlur})` }} aria-hidden="true">
        <div className="wave" style={{ backgroundImage: `url(${waveB})` }} />
        <Particles count={14} seed={37} />
      </div>
      <div className="pg-hero__inner">
        <nav className="pg-hero__crumbs" aria-label="パンくずリスト">
          <Link to="/">HOME</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{en}</span>
        </nav>
        <h1 id="pg-title" className="pg-hero__title">
          <SplitChars className="pg-hero__en" text={en} />
          <span className="pg-hero__ja">{ja}</span>
        </h1>
        {lead && <p className="pg-hero__lead">{lead}</p>}
      </div>
    </section>
  );
};
