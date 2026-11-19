import React, { useRef } from 'react';
import { SplitChars } from './parts';
import { eachFromTo, gsap, isLite, scrollToEl, scrubTl, useSceneMotion } from './motion';

/** キービジュアル（文字なし）。PC は横長、スマホ・縦長は製品まわりを切り出した版 */
const bgPc = '/newtone/concept-bg.webp';
const bgSp = '/newtone/concept-sp.webp';

/**
 * SCENE 02 — CONCEPT
 * コスメのキービジュアルを全面に敷き、コピーを重ねる。
 * すべてスクロールに同期（scrub）。動かすのは transform / opacity のみ。
 */
export const ManifestoScene: React.FC = () => {
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, ({ desktop, scope }) => {
    // 背景：ゆっくり寄りから引いていく（軽量端末では動かさない）
    if (!isLite()) {
      gsap.fromTo(
        '.mf__img',
        { scale: 1.08, yPercent: 3 },
        {
          scale: 1,
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: scope, start: 'top bottom', end: desktop ? 'top top' : 'bottom 60%', scrub: true },
        },
      );
    }

    if (!desktop) {
      // スマホ：要素ごとに、画面へ入るあいだで完成する。上へ戻せば逆再生
      const tag = scrubTl('.mf__bg', { start: 'top 60%', end: 'bottom 70%' });
      tag.fromTo('.mf__tag', { opacity: 0, xPercent: -8 }, { opacity: 1, xPercent: 0, duration: 0.5 }, 0);
      tag.fromTo('.mf__tag-line', { scaleX: 0 }, { scaleX: 1, duration: 0.5 }, 0.2);

      const eb = scrubTl('.mf__eyebrow', { start: 'top 94%', end: 'top 70%' });
      eb.fromTo('.mf__rule--l, .mf__rule--r', { scaleX: 0 }, { scaleX: 1, duration: 0.7 }, 0);
      eb.fromTo('.mf__eyebrow-text', { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0);

      const title = scrubTl('.mf__title', { start: 'top 90%', end: 'top 45%' });
      eachFromTo(title, '.mf__title .char', { opacity: 0.12, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.2, ease: 'power2.out' }, 0.05, 0.04);
      title.fromTo('.mf__glow', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.3 }, 0.6);

      gsap.utils.toArray<HTMLElement>('.mf__body p', scope).forEach((p) => {
        scrubTl(p, { end: 'top 68%' }).fromTo(p, { opacity: 0.14, y: 18 }, { opacity: 1, y: 0 }, 0);
      });
      scrubTl('.mf__cue', { start: 'top 100%', end: 'top 92%' }).fromTo('.mf__cue', { opacity: 0 }, { opacity: 1 }, 0);
      return;
    }

    // PC：読む速さで要素が順に灯っていく
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: scope, start: 'top 72%', end: 'top 8%', scrub: true },
      })
      .fromTo('.mf__rule--l, .mf__rule--r', { scaleX: 0 }, { scaleX: 1, duration: 0.14 }, 0)
      .fromTo('.mf__eyebrow-text', { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.03)
      .fromTo('.mf__tag', { opacity: 0, xPercent: -10 }, { opacity: 1, xPercent: 0, duration: 0.16, ease: 'power2.out' }, 0.1)
      .fromTo('.mf__tag-line', { scaleX: 0 }, { scaleX: 1, duration: 0.16 }, 0.18)
      .fromTo('.mf__title .char', { opacity: 0.12 }, { opacity: 1, duration: 0.08, stagger: 0.026 }, 0.12)
      .fromTo('.mf__glow', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.14 }, '>-0.04')
      .fromTo('.mf__body p', { opacity: 0.14, y: 14 }, { opacity: 1, y: 0, duration: 0.16, stagger: 0.09 }, '>-0.08')
      .fromTo('.mf__cue', { opacity: 0 }, { opacity: 1, duration: 0.12 }, '>-0.06');
  });

  const goNext = () => {
    const next = ref.current?.nextElementSibling;
    if (next instanceof HTMLElement) scrollToEl(next);
  };

  return (
    <section id="about" ref={ref} className="mf" aria-labelledby="mf-title">
      <div className="mf__bg" aria-hidden="true">
        <picture>
          <source media="(min-width: 768px) and (min-aspect-ratio: 6/5)" srcSet={bgPc} />
          <img className="mf__img" src={bgSp} alt="" width={1000} height={887} loading="lazy" decoding="async" draggable={false} />
        </picture>
        <span className="mf__shade" />
      </div>

      <p className="mf__eyebrow">
        <i className="mf__rule mf__rule--l" aria-hidden="true" />
        <span className="mf__eyebrow-text">01 — CONCEPT</span>
        <i className="mf__rule mf__rule--r" aria-hidden="true" />
      </p>

      <p className="mf__tag" aria-hidden="true">
        <span>THE NEXT BEAUTY.</span>
        <i className="mf__tag-line" />
      </p>

      <div className="mf__text">
        <h2 id="mf-title" className="mf__title">
          <SplitChars className="line" text="美しさは、" />
          <SplitChars className="line" text="わたしたちが" />
          <span className="line">
            <SplitChars text="つくる" />
            <span className="mf__future">
              <SplitChars text="未来。" />
            </span>
          </span>
        </h2>
        <i className="mf__glow" aria-hidden="true" />
        <div className="mf__body">
          <p>美容は、外見を変えるためだけのものじゃない。</p>
          <p>自分らしさを見つけて、新しい価値観をかたちにする、ひとつの表現。</p>
          <p>
            学生起業家や若きクリエイターが生み出したブランドに、
            <br className="pc-br" />
            直接出会えるPOPUP。それが、NEWTONE です。
          </p>
        </div>
      </div>

      <button type="button" className="mf__cue" onClick={goNext} aria-label="次のセクションへ進む">
        <span className="mf__cue-row">
          <i className="mf__cue-line" aria-hidden="true" />
          <span className="mf__cue-text">DISCOVER</span>
          <i className="mf__cue-line" aria-hidden="true" />
        </span>
        <svg className="mf__chev" viewBox="0 0 16 9" fill="none" aria-hidden="true">
          <path d="M1 1l7 6.5L15 1" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>
    </section>
  );
};

/** 場面転換の帯：巨大なタイポが左右へすれ違う（transform のみ） */
export const TickerBand: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useSceneMotion(ref, () => {
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true },
      })
      .fromTo('.tk__row--a', { xPercent: -2 }, { xPercent: -27 }, 0)
      .fromTo('.tk__row--b', { xPercent: -30 }, { xPercent: -8 }, 0);
  });

  return (
    <div ref={ref} className="tk" aria-hidden="true">
      <div className="tk__row tk__row--a">
        {[0, 1, 2, 3].map((i) => (
          <span key={i}>
            DISCOVER. <em>CONNECT.</em> INSPIRE.
          </span>
        ))}
      </div>
      <div className="tk__row tk__row--b">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i}>
            The Next Beauty. <i>✦</i> <b>未来の“好き”に、きっと出会える。</b> <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
};
