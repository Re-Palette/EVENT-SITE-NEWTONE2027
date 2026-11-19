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
 * 見出し・4つの理由・結びの文を、ヘッダー下の1画面（100svh）にすべて収める。
 */
export const ForYouScene: React.FC = () => {
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, ({ scope }) => {
    // 全体が1画面に収まるので、ピン留めはせず、セクションが画面に入ってくる間にひと続きで組み立てる
    // （セクション上端が画面上端に着く頃には完成している）
    const tl = scrubTl(scope, { start: 'top 88%', end: 'top 12%' });
    eachFromTo(tl, '.fy__head > *', { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.3 }, 0, 0.07);
    // 各行：罫線が左から伸び、番号と文が順に立ち上がる
    gsap.utils.toArray<HTMLElement>('.fy__item', scope).forEach((item, i) => {
      const at = 0.18 + i * 0.1;
      tl.fromTo(item.querySelector('.fy__rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: 'power2.inOut' }, at)
        .fromTo(item.querySelector('.fy__no'), { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.25 }, at + 0.05)
        .fromTo(item.querySelector('.fy__reason'), { opacity: 0.1, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, at + 0.1);
    });
    tl.fromTo('.fy__note', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25 }, 0.62);
    tl.set({}, {}, 1);
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
