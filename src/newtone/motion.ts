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

/**
 * 全シーンがピン留めするので、後ろのシーンの開始位置は前のシーンのピン分の余白を含めて計算される必要がある。
 * シーンの再構築（ブレークポイントを跨いだとき等）で作成順が崩れても、上から順に並べ直してから再計算する。
 */
let refreshQueued = 0;
function queueRefresh() {
  if (refreshQueued) return;
  refreshQueued = requestAnimationFrame(() => {
    refreshQueued = 0;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  });
}

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
      let mm: gsap.MatchMedia | undefined;
      const build = () => {
        mm?.revert();
        mm = gsap.matchMedia(el);
        // gsap.matchMedia は「条件のどれか1つでも真」のときだけ関数を呼ぶ。
        // スマホ（desktop も reduce も偽）でも必ず呼ばれるよう、常に真の条件 all を加える
        mm.add({ all: 'all', desktop: MQ_DESKTOP, reduce: MQ_REDUCE }, (c) => {
          const { desktop, reduce } = c.conditions as { desktop: boolean; reduce: boolean };
          if (reduce) return;
          const cleanup = setup({ desktop, scope: el });
          queueRefresh();
          return cleanup;
        });
      };
      build();
      // フォント・画像が出そろうと場面の高さが変わり、「1画面に収まるか」の判定が変わりうる。
      // ピン中の要素は寸法が固定されて測れないので、いったん元に戻して測り直す（読み込み直後に1回だけ）
      const onSettled = () => build();
      window.addEventListener(SETTLED, onSettled);
      return () => {
        window.removeEventListener(SETTLED, onSettled);
        mm?.revert();
      };
    },
    { scope },
  );
}

/** フォント・画像が出そろって高さが確定したときに送るイベント */
const SETTLED = 'nt-layout-settled';

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

/**
 * アンカー・ボタンで飛ぶときの着地位置。
 * 上端でピンする場面は、先頭（登場前で何も見えない）ではなく「静止区間（全部見えている状態）」に着地する。
 * それ以外（長い場面・ピンなし）は要素の先頭。ピン留めの余白（pin-spacer）は文書上の位置に含まれている。
 */
export function anchorY(target: HTMLElement) {
  const el = target.classList.contains('pin-spacer') && target.firstElementChild instanceof HTMLElement ? target.firstElementChild : target;
  const st = ScrollTrigger.getAll().find(
    (t) => t.pin && typeof t.vars.start === 'string' && t.vars.start.startsWith('top top') && (t.pin === el || t.pin.contains(el) || el.contains(t.pin)),
  );
  // 静止区間は後ろ40%。その中ほど（登場の後ろ75%）に着地する
  if (st && !isNaN(st.start) && !isNaN(st.end)) return Math.round(st.start + (st.end - st.start) * 0.75);
  const holder = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el;
  return Math.round(holder.getBoundingClientRect().top + window.scrollY);
}

/** 要素の先頭へスクロール。慣性スクロールがあればそれで、なければ通常のスムーズスクロール */
export function scrollToEl(el: HTMLElement) {
  if (activeLenis) {
    activeLenis.scrollTo(anchorY(el), { duration: 1.4 });
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
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
    activeLenis = lenis;
    const off = lenis.on('scroll', ScrollTrigger.update);
    // ページ内リンク（#about など）：ピンの余白を含めた位置へ、静止区間に着地するよう自分で動かす
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.hash.length < 2 || a.hash === '#main') return;
      const target = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(anchorY(target), { duration: 1.6 });
    };
    document.addEventListener('click', onClick);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();
    return () => {
      off();
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      if (activeLenis === lenis) activeLenis = null;
    };
  }, []);

  useEffect(() => {
    let settledAt = 0;
    const refresh = () => {
      const now = performance.now();
      if (now - settledAt > 300) window.dispatchEvent(new Event(SETTLED));
      settledAt = now;
      ScrollTrigger.refresh();
    };
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
    scrollTrigger: { trigger, start: 'top 96%', end: 'top 72%', scrub: SCRUB, invalidateOnRefresh: true, ...st },
  });
}

/* =========================================================
   ピン留め（各場面で「一瞬止まって、全部見える」）
   - 1画面に収まる場面：'top top' でピン → 前半60%で登場アニメ → 後半40%はすべてが見えた状態で静止（HOLD）
   - 1画面より長い場面：要素は画面に入るあいだに完成させ（'top 75%' まで）、'bottom bottom' でピン → 少し静止
   ========================================================= */

/** 登場アニメが占める割合（残りが HOLD） */
export const PIN_ANIM = 0.6;
/** 上端ピンの長さ（画面の高さに対する倍率） */
const pinDist = (desktop: boolean) => (desktop ? 1.4 : 1.0);
/**
 * 場面（scene()）の上端ピンの長さ。登場の大半はピンの前（'top 85%' → 'top top'）で進み、ピンでは最後の仕上げ（約12%）と静止だけを行うので短くてよい。
 */
const scenePinDist = (desktop: boolean) => (desktop ? 1.0 : 0.7);
/** ピンの前に登場を始める位置（場面の上端がこの高さに来たとき） */
const PRE_START = 0.85;
/** ピンの最初の何割までに登場を終えるか */
const PIN_ENTRANCE = 0.12;
/** 下端ピン（HOLD のみ）の長さ */
const holdDist = (desktop: boolean) => (desktop ? 0.5 : 0.45);

/** 場面が1画面に収まるか（わずかな誤差は許す）。refresh 時ではなく setup 時の画面サイズで判定する */
export const fitsViewport = (el: HTMLElement, slack = 1.02) => Math.max(el.offsetHeight, el.scrollHeight) <= window.innerHeight * slack;

const pinBase = {
  pin: true,
  pinSpacing: true,
  anticipatePin: 1,
  invalidateOnRefresh: true,
} as const;

/** 上端でピンして、そのあいだ scrub で進むタイムライン。作り終えたら holdEnd() で後半に静止区間を足す */
export function pinTl(trigger: gsap.DOMTarget, desktop: boolean) {
  return gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: () => `+=${Math.round(window.innerHeight * pinDist(desktop))}`,
      scrub: SCRUB,
      ...pinBase,
    },
  });
}

/** タイムラインの末尾に空の区間を足し、登場アニメが全体の PIN_ANIM になるようにする（＝残りは完成形で静止） */
export function holdEnd(tl: gsap.core.Timeline, anim = PIN_ANIM) {
  const d = tl.duration();
  tl.to({}, { duration: (d * (1 - anim)) / anim }, d);
  return tl;
}

/** 長い場面の下端ピン：下端が画面の下端に着いたところで少し止める */
export function pinBottom(trigger: HTMLElement, desktop: boolean) {
  return ScrollTrigger.create({
    trigger,
    start: 'bottom bottom',
    end: () => `+=${Math.round(window.innerHeight * holdDist(desktop))}`,
    ...pinBase,
  });
}

/** 登場が全体（ピン前の助走 + ピン）に占める割合。ピンの前に始まるので、ピンに入った時点でおよそ80%は進んでいる */
function entranceShare(desktop: boolean) {
  const vh = window.innerHeight;
  const dist = vh * scenePinDist(desktop);
  return (vh * PRE_START + dist * PIN_ENTRANCE) / (vh * PRE_START + dist);
}

/**
 * 上端ピンの場面用：ピンそのものと、登場アニメを動かすタイムラインを別々のトリガーで作る。
 * タイムラインは 'top 85%'（場面が画面下から上がってくる途中）から始まり、ピンの終わりまで一続きで scrub される。
 * ＝ピンに入る前から中身が埋まりはじめ、ピンの間は最後の仕上げ + 静止。
 */
function preAndPinTl(scope: HTMLElement, desktop: boolean) {
  const dist = () => Math.round(window.innerHeight * scenePinDist(desktop));
  ScrollTrigger.create({ trigger: scope, start: 'top top', end: () => `+=${dist()}`, ...pinBase });
  return gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: scope,
      start: `top ${PRE_START * 100}%`,
      end: () => `top+=${dist()} top`,
      scrub: SCRUB,
      invalidateOnRefresh: true,
    },
  });
}

/**
 * 場面の登場アニメの入れ物。
 * - 1画面に収まる（fit）→ 上端ピンのタイムライン。tl に登場を組み、finish() で後半に静止区間を足す。
 *   rv() で渡した「要素ごとの登場」は、ピンのタイムラインのなかに順に並べられる（スマホ用）。
 * - 収まらない → tl は通常の scrub タイムライン（reveal の範囲で完成）。rv() は要素ごとの scrub。
 *   finish() で下端ピン（'bottom bottom'）を作る。
 * 使い方：const s = scene(scope, desktop, {start, end}); s.tl.fromTo(...) / s.rv(el, {...}).fromTo(...); s.finish();
 */
export interface SceneHandle {
  fit: boolean;
  tl: gsap.core.Timeline;
  rv: (trigger: gsap.DOMTarget, st?: Omit<ScrollTrigger.Vars, 'trigger'>) => gsap.core.Timeline;
  finish: () => void;
}

export function scene(scope: HTMLElement, desktop: boolean, reveal: Omit<ScrollTrigger.Vars, 'trigger'> = {}): SceneHandle {
  const fit = fitsViewport(scope);
  let main: gsap.core.Timeline | undefined;
  let cursor = 0;
  const api: SceneHandle = {
    fit,
    get tl() {
      return (main ??= fit
        ? preAndPinTl(scope, desktop)
        : gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: scope, start: 'top 80%', end: 'top 25%', scrub: SCRUB, invalidateOnRefresh: true, ...reveal },
          }));
    },
    rv(trigger, st = {}) {
      if (!fit) return scrubTl(trigger, st);
      const t = gsap.timeline({ defaults: { ease: 'none' } });
      api.tl.add(t, cursor);
      cursor += 0.18;
      return t;
    },
    finish() {
      if (fit) holdEnd(api.tl, entranceShare(desktop));
      else pinBottom(scope, desktop);
    },
  };
  return api;
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
export function parallax(
  targets: gsap.DOMTarget,
  trigger: gsap.DOMTarget,
  from: gsap.TweenVars,
  to: gsap.TweenVars,
  /** 下端ピンの場面では 'bottom bottom'（ピンで止まる前に動きを終える） */
  end = 'bottom top',
) {
  if (isLite()) return;
  return gsap.fromTo(targets, from, {
    ease: 'none',
    ...to,
    scrollTrigger: { trigger, start: 'top bottom', end, scrub: true },
  });
}
