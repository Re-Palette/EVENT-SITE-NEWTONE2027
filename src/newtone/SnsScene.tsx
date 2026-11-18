import React, { useRef } from 'react';
import { SplitChars } from './parts';
import { SnsLinks } from './SnsLinks';
import { gsap, revealOnce, useSceneMotion } from './motion';

/**
 * SNS — 公式SNS（FOLLOW US）
 * アカウントは site.ts の SNS。確定したものだけを載せる。
 */
export const SnsScene: React.FC = () => {
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, ({ desktop }) => {
    if (!desktop) {
      revealOnce('.sns-sc__head > *', '.sns-sc__head');
      revealOnce('.sns__item', '.sns__list', { y: 28, stagger: 0.1 });
      return;
    }
    gsap
      .timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: ref.current, start: 'top 82%', end: 'top 30%', scrub: true } })
      .fromTo('.sns-sc__head > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08 }, 0)
      .fromTo('.sns__item', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.1 }, 0.25);
  });

  return (
    <section id="sns" ref={ref} className="sns-sc" aria-labelledby="sns-title">
      <header className="sns-sc__head">
        <p className="eyebrow">Follow Us</p>
        <h2 id="sns-title" className="sns-sc__title">
          <SplitChars className="sns-sc__en" text="FOLLOW US" />
          <span className="sns-sc__ja">公式SNS</span>
        </h2>
        <p className="sns-sc__lead">NEWTONE 2027 の最新情報は、公式SNSでお届けします。ぜひフォローしてください。</p>
      </header>
      <SnsLinks />
    </section>
  );
};
