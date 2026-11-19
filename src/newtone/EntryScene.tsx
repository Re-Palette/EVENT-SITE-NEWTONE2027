import React, { useRef } from 'react';
const heroBlur = '/newtone/hero-blur.webp';
const waveB = '/newtone/wave-b.webp';
const crowd = '/newtone/crowd.webp';
import { CONTACT_HREF, SITE } from './site';
import { SiteFooter } from './SiteFooter';
import { SnsLinks } from './SnsLinks';
import { ArrowRight, BrushUnderline, Particles, SplitChars } from './parts';
import { eachFromTo, gsap, scene, useSceneMotion } from './motion';

const contactHref = CONTACT_HREF;

/**
 * SCENE 08 — ENTRY / JOIN ＋ フッター
 * 最後は HERO の光へ戻り、大きなコピーと1つのボタンだけを残す。
 */
export const EntryScene: React.FC<{ showSns?: boolean }> = ({ showSns = false }) => {
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, ({ desktop, scope }) => {
    // ピン留めするのはフッターを除いたステージ。1画面に収まれば上端で登場 → 静止、収まらなければ下端でピン
    const stage = scope.querySelector<HTMLElement>('.en__stage');
    if (!stage) return;
    const s = scene(stage, desktop, { start: 'top 75%', end: 'top 20%' });
    const rest = ['.en__lead', '.en .cta--main', '.en__pending', '.en__sns'].filter((sel) => scope.querySelector(sel));

    if (!desktop) {
      // 大きなコピーが1文字ずつせり上がり、筆致のラインが引かれ、残りが続く（PC と同じ組み立て・スクロール同期）
      const title = s.rv('.en__title', { start: 'top 92%', end: 'top 55%' });
      title
        .fromTo('.en .eyebrow', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15 }, 0)
        .fromTo('.en__script', { opacity: 0, xPercent: -12 }, { opacity: 1, xPercent: 0, duration: 0.25, ease: 'power2.out' }, 0.05);
      eachFromTo(title, '.en__title .char', { opacity: 0, yPercent: 80 }, { opacity: 1, yPercent: 0, duration: 0.3, ease: 'power2.out' }, 0.12, 0.04);
      eachFromTo(title, '.en .brush-path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.25 }, 0.65, 0.06);
      for (const sel of rest) s.rv(sel, { start: 'top 100%', end: 'bottom 100%' }).fromTo(sel, { opacity: 0, y: 30 }, { opacity: 1, y: 0 }, 0);
    } else {
      s.tl
        .fromTo('.en .eyebrow', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.15 }, 0)
        .fromTo('.en__script', { opacity: 0, xPercent: -12 }, { opacity: 1, xPercent: 0, duration: 0.25, ease: 'power2.out' }, 0.05)
        .fromTo('.en__title .char', { opacity: 0, yPercent: 70 }, { opacity: 1, yPercent: 0, duration: 0.3, stagger: 0.025, ease: 'power2.out' }, 0.12)
        .fromTo('.en .brush-path', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.2, stagger: 0.05 }, '>-0.08')
        .fromTo(rest, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.22, stagger: 0.07 }, '>-0.12');
    }

    // 背景の巨大ロゴと光は、場面を通り過ぎるあいだゆっくり流れる（ピンで止まる前に終える）
    if (s.fit) {
      const d = s.tl.duration();
      s.tl
        .fromTo('.en__mega', { xPercent: 0 }, { xPercent: -30, duration: d }, 0)
        .fromTo('.en .wave', { xPercent: 14, yPercent: 6 }, { xPercent: -6, yPercent: -6, duration: d }, 0)
        .fromTo('.en__crowd', { yPercent: 22 }, { yPercent: 0, duration: d * 0.6 }, 0);
    } else {
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: stage, start: 'top bottom', end: 'bottom bottom', scrub: true },
        })
        .fromTo('.en__mega', { xPercent: 0 }, { xPercent: -30, duration: 1 }, 0)
        .fromTo('.en .wave', { xPercent: 14, yPercent: 6 }, { xPercent: -6, yPercent: -6, duration: 1 }, 0)
        .fromTo('.en__crowd', { yPercent: 22 }, { yPercent: 0, duration: 0.6 }, 0);
    }
    s.finish();
  });

  return (
    <section id="contact" ref={ref} className="en" aria-labelledby="entry-title">
      <div className="en__stage">
        <div className="en__bg" style={{ backgroundImage: `url(${heroBlur})` }} aria-hidden="true">
          <div className="wave" style={{ backgroundImage: `url(${waveB})` }} />
          <div className="en__crowd" style={{ backgroundImage: `url(${crowd})` }} />
          <Particles count={16} seed={211} />
        </div>
        <p className="en__mega" aria-hidden="true">
          <span>NEWTONE 2027</span>
          <span>NEWTONE 2027</span>
          <span>NEWTONE 2027</span>
        </p>
        <div className="en__inner">
          <p className="eyebrow">07 — Entry / Join</p>
          <p className="en__script" aria-hidden="true">
            See you there.
          </p>
          <h2 id="entry-title" className="en__title">
            <SplitChars text="次の" />
            <span className="en__mark">
              <SplitChars text="“好き”" />
              <BrushUnderline id="brush-entry" />
            </span>
            <SplitChars text="に、" />
            <br />
            <SplitChars text="会いにきて。" />
          </h2>
          <p className="en__lead">
            あなたの“好き”が、次の美容のはじまりになる。
            <br />
            NEWTONE 2027 で、お待ちしています。
          </p>
          {contactHref ? (
            <a
              className="cta cta--main"
              href={contactHref}
              {...(SITE.contact.entryUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <span>参加・お問い合わせ</span>
              <ArrowRight className="cta__arrow" />
            </a>
          ) : (
            <>
              <span className="cta cta--main" role="link" aria-disabled="true" aria-describedby="entry-pending">
                <span>参加・お問い合わせ</span>
                <ArrowRight className="cta__arrow" />
              </span>
              <p id="entry-pending" className="en__pending">
                受付窓口は準備が整い次第、こちらでご案内します。
              </p>
            </>
          )}
          {showSns && (
            <div className="en__sns">
              <p className="en__sns-lead">最新情報は公式SNSで発信中です。ぜひフォローしてください。</p>
              <SnsLinks />
            </div>
          )}
        </div>
      </div>

      <SiteFooter />
    </section>
  );
};
