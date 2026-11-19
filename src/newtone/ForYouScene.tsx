import React, { useRef } from 'react';
import { Phrases } from './parts';
import { eachFromTo, gsap, scrubTl, useSceneMotion } from './motion';

const REASONS = [
  '新しいコスメや|スキンケアに、|誰よりも早く|出会いたい。',
  'つくり手の想いや|ストーリーごと、|ブランドを|好きになりたい。',
  'まだ誰も知らない|“推し”を、|自分の目で|見つけたい。',
  '美容の仕事や|ブランドづくりに、|興味がある。',
] as const;

/**
 * SCENE 06 — FOR YOU
 * 夜の色が続いたあとに、HEROの光と同じラベンダーの紙面を1枚はさむ。
 * 左の見出しは CSS の sticky で留まり、右の4行が順に現れる。
 */
export const ForYouScene: React.FC = () => {
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, ({ desktop, scope }) => {
    if (!desktop) {
      eachFromTo(scrubTl('.fy__head', { end: 'top 50%' }), '.fy__head > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5 }, 0, 0.25);
      // 各行：罫線が左から伸び、番号と文が順に立ち上がる（PC と同じ組み立て。スクロール同期）
      gsap.utils.toArray<HTMLElement>('.fy__item', scope).forEach((item) => {
        scrubTl(item, { start: 'top 92%', end: 'top 58%' })
          .fromTo(item.querySelector('.fy__rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power2.inOut' }, 0)
          .fromTo(item.querySelector('.fy__no'), { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.5 }, 0.1)
          .fromTo(item.querySelector('.fy__reason'), { opacity: 0.1, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 0.2);
      });
      scrubTl('.fy__note', { start: 'top 95%', end: 'top 65%' }).fromTo('.fy__note', { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, 0);
      return;
    }
    gsap
      .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.fy__sheet', start: 'top 80%', end: 'top 25%', scrub: true } })
      .fromTo('.fy__head > *', { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.14 }, 0);

    gsap
      .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.fy__list', start: 'top 82%', end: 'bottom 62%', scrub: true } })
      .fromTo('.fy__rule', { scaleX: 0 }, { scaleX: 1, duration: 0.3, stagger: 0.2 }, 0)
      .fromTo('.fy__no', { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.2, stagger: 0.2 }, 0.04)
      .fromTo('.fy__reason', { opacity: 0.1, y: 22 }, { opacity: 1, y: 0, duration: 0.26, stagger: 0.2 }, 0.04)
      .fromTo('.fy__note', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.2 }, '>-0.05');
  });

  return (
    <section ref={ref} className="fy" aria-labelledby="fy-title">
      <div className="fy__sheet">
        <header className="fy__head">
          <p className="eyebrow">05 — For You</p>
          <h2 id="fy-title" className="fy__title">
            こんなあなたを、
            <br />
            待っています。
          </h2>
          <p className="fy__script" aria-hidden="true">
            This is for you.
          </p>
        </header>

        <div className="fy__main">
          <ol className="fy__list">
            {REASONS.map((r, i) => (
              <li key={r} className="fy__item">
                <i className="fy__rule" aria-hidden="true" />
                <span className="fy__no" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="fy__reason">
                  <Phrases text={r} />
                </p>
              </li>
            ))}
          </ol>
          <p className="fy__note">
            ひとつでも当てはまったら、NEWTONE はきっと、あなたのための場所です。
            <br />
            美容にくわしくなくても大丈夫。“気になる”だけで、じゅうぶんです。
          </p>
        </div>
      </div>
    </section>
  );
};
