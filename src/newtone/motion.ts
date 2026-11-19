import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { useEffect, type RefObject } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

ScrollTrigger.config({ ignoreMobileResize: true });

/** newtone.css の「長いピン留め演出」と同じ条件。ここが true のときだけピン留めする */
export const MQ_DESKTOP = '(min-width: 768px) and (min-aspect-ratio: 6/5)';
export const MQ_REDUCE = '(prefers-reduced-motion: reduce)';

type Setup = (ctx: { desktop: boolean; scope: HTMLElement }) => void | (() => void);

/**
 * シーンごとのスクロール同期アニメーション。
 * - DOMの初期状態＝完成形。GSAPは「そこへ至る途中の状態」だけを scrub で与える
 * - prefers-reduced-motion: reduce のときは何もしない（完成形のまま表示）
 * - ブレークポイントを跨ぐと matchMedia が自動で revert / 再構築する
 */
export function useSceneMotion(scope: RefObject<HTMLElement | null>, setup: Setup) {
  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;
      const mm = gsap.matchMedia(el);
      // gsap.matchMedia は「条件のどれか1つでも真」のときだけ関数を呼ぶ。
      // スマホ（desktop も reduce も偽）でも必ず呼ばれるよう、常に真の条件 all を加える
      mm.add({ all: 'all', desktop: MQ_DESKTOP, reduce: MQ_REDUCE }, (c) => {
        const { desktop, reduce } = c.conditions as { desktop: boolean; reduce: boolean };
        if (reduce) return;
        return setup({ desktop, scope: el });
      });
      return () => mm.revert();
    },
    { scope },
  );
}

export { gsap, ScrollTrigger };

/** 低電力端末（コア数・メモリが少ない、データセーバー）。ARQO と同じ判定で軽量表示に切り替える */
export function isLiteDevice() {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4 || nav.connection?.saveData === true;
}

let activeLenis: Lenis | null = null;

/** 先頭へ戻す。ページ移動時は即座に、同じページ内（ロゴ等）では慣性スクロールでなめらかに */
export function scrollToTop(smooth = false) {
  // Lenis が無い（視差効果を減らす設定）ときは常に即座に
  if (smooth && activeLenis) {
    activeLenis.scrollTo(0, { duration: 1.2 });
    return;
  }
  activeLenis?.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

/** 要素の先頭へスクロール。慣性スクロールがあればそれで、なければ通常のスムーズスクロール */
export function scrollToEl(el: HTMLElement) {
  if (activeLenis) {
    activeLenis.scrollTo(el, { duration: 1.4 });
    return;
  }
  el.scrollIntoView({ behavior: 'auto', block: 'start' });
}

/**
 * 慣性スクロール（Lenis。設定は ARQO サイトと同じ）を GSAP の ticker で駆動し、ScrollTrigger と同期させる。
 * フォント・画像の読み込みや bfcache 復帰時に位置を再計算する。
 */
export function useScrollSync() {
  useEffect(() => {
    if (isLiteDevice()) document.documentElement.dataset.perf = 'lite';
    if (window.matchMedia(MQ_REDUCE).matches) return;
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: { duration: 1.6 } });
    activeLenis = lenis;
    const off = lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();
    return () => {
      off();
      gsap.ticker.remove(tick);
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
    };
  }, []);

  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    const onShow = (e: PageTransitionEvent) => e.persisted && refresh();
    window.addEventListener('pageshow', onShow);
    return () => {
      window.removeEventListener('load', refresh);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);
}

/** スマホ用スクロール同期の追従（秒）。Lenis の慣性に重ねて、指の動きに少し遅れてついてくる */
export const SCRUB = 0.6;

/**
 * スマホ用：要素ごとのスクロール同期タイムライン（上へ戻せば逆再生）。
 * 画面下 92% で動き出し、画面中ほど 55% に来るまでに完成形になる。
 * useSceneMotion の setup 内で呼ぶこと（matchMedia の revert でまとめて片付く）。
 */
export function scrubTl(trigger: gsap.DOMTarget, st: Omit<ScrollTrigger.Vars, 'trigger'> = {}) {
  return gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger, start: 'top 92%', end: 'top 55%', scrub: SCRUB, invalidateOnRefresh: true, ...st },
  });
}

/**
 * 要素ごとに少しずつ遅らせて動かす（stagger の代わり）。
 * タイムライン内の stagger は2つ目以降の初期状態が描画されず、未到達なのに見えてしまうため、1つずつ置く。
 */
export function eachFromTo(
  tl: gsap.core.Timeline,
  targets: gsap.DOMTarget,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  at = 0,
  each = 0.1,
) {
  gsap.utils.toArray<Element>(targets).forEach((t, i) => tl.fromTo(t, { ...from }, { ...to }, at + i * each));
  return tl;
}

/** 低電力端末か（data-perf は親の effect で付くため、子の setup 時点では端末判定も見る） */
export const isLite = () => document.documentElement.dataset.perf === 'lite' || isLiteDevice();

/** 場面を通過するあいだ、背景・画像をわずかにずらす（スクロール連動。軽量端末では何もしない） */
export function parallax(targets: gsap.DOMTarget, trigger: gsap.DOMTarget, from: gsap.TweenVars, to: gsap.TweenVars) {
  if (isLite()) return;
  return gsap.fromTo(targets, from, {
    ease: 'none',
    ...to,
    scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}
