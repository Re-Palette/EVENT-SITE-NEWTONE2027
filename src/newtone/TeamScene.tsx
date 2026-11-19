import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { TEAM_GROUPS, TEAM_MEMBERS, type TeamMember } from './team';
import { ArrowRight } from './parts';
import { gsap, scrubTl, useSceneMotion } from './motion';

/** X（旧Twitter）のロゴ。lucide にブランドアイコンがないので自前で持つ */
const XIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/** 写真がないときの頭文字（姓の1文字目 + 名の1文字目。英字なら先頭2語の頭文字） */
/** 写真がないときの頭文字。英字表記があれば「T Y」→「TY」、日本語名だけなら姓の1文字目（「山田 太郎」→「山」） */
function initials(m: TeamMember) {
  const latin = (m.nameEn ?? '').trim();
  if (latin) {
    return latin
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => Array.from(w)[0]?.toUpperCase() ?? '')
      .join('');
  }
  return Array.from(m.name.trim())[0] ?? '';
}

/**
 * 所属。「／」で区切った単位（大学名・団体名など）の途中では改行せず、
 * 1行に収まらないときは区切りの後ろで折り返す。
 */
const Affiliation: React.FC<{ text: string }> = ({ text }) => {
  const parts = text
    .split(/\s*[／/]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <p className="tm__aff">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <span className="tm__aff-part">
            {p}
            {i < parts.length - 1 && <span className="tm__aff-sep"> ／</span>}
          </span>
          {i < parts.length - 1 && ' '}
        </React.Fragment>
      ))}
    </p>
  );
};

const MemberCard: React.FC<{ member: TeamMember }> = ({ member: m }) => {
  const links = [
    m.sns?.instagram && { key: 'instagram', label: 'Instagram', url: m.sns.instagram, icon: <Instagram strokeWidth={1.5} aria-hidden="true" /> },
    m.sns?.x && { key: 'x', label: 'X', url: m.sns.x, icon: <XIcon /> },
  ].filter(Boolean) as { key: string; label: string; url: string; icon: React.ReactNode }[];
  return (
    <li className="tm__card">
      <div className="tm__frame">
        {m.photo ? (
          <img className="tm__photo" src={m.photo} alt={`${m.name}のポートレート`} loading="lazy" decoding="async" />
        ) : (
          <span className="tm__mono" aria-hidden="true">
            {initials(m)}
          </span>
        )}
      </div>
      <p className="tm__role">{m.role}</p>
      <h3 className="tm__name">{m.name}</h3>
      {m.nameEn && <p className="tm__name-en">{m.nameEn}</p>}
      {m.affiliation && <Affiliation text={m.affiliation} />}
      {m.bio && <p className="tm__bio">{m.bio}</p>}
      {links.length > 0 && (
        <ul className="tm__sns">
          {links.map((l) => (
            <li key={l.key}>
              <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`${m.name}の${l.label}（新しいタブで開きます）`}>
                {l.icon}
              </a>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

/** メンバー未掲載のあいだの枠（架空の人物は出さない） */
const PlaceholderCard: React.FC<{ first?: boolean }> = ({ first }) => (
  <li className="tm__card tm__card--ph" aria-hidden={first ? undefined : true}>
    <div className="tm__frame">
      {!first && (
        <svg className="tm__sil" viewBox="0 0 100 125" aria-hidden="true">
          <circle cx="50" cy="48" r="17" />
          <path d="M18 112c2-22 15-34 32-34s30 12 32 34z" />
        </svg>
      )}
      {first && (
        <span className="tm__soon">
          <span className="tm__soon-en">Coming soon</span>
          <span className="tm__soon-ja">メンバー紹介は近日公開</span>
        </span>
      )}
    </div>
  </li>
);

/**
 * TEAM — 運営メンバー一覧。データは team.ts。
 * メンバーがいない間は枠だけを出す。team が設定されたメンバーがいればグループ見出しを付ける。
 */
export const TeamScene: React.FC = () => {
  const ref = useRef<HTMLElement>(null);

  useSceneMotion(ref, ({ scope }) => {
    // カードは1枚ずつ、画面へ入るあいだに現れる（スクロール同期・上へ戻せば逆再生）
    gsap.utils.toArray<HTMLElement>('.tm__card', scope).forEach((c) => {
      scrubTl(c, { start: 'top 98%', end: 'top 70%' }).fromTo(c, { opacity: 0, y: 36, scale: 0.97 }, { opacity: 1, y: 0, scale: 1 }, 0);
    });
    scrubTl('.tm__contact', { start: 'top 100%', end: 'top 72%' }).fromTo('.tm__contact', { opacity: 0, y: 34 }, { opacity: 1, y: 0 }, 0);
  });

  const grouped = TEAM_MEMBERS.some((m) => m.team && TEAM_GROUPS.some((g) => g.key === m.team));
  const sections = grouped
    ? [
        ...TEAM_GROUPS.map((g) => ({ key: g.key as string, en: g.en, ja: g.ja, members: TEAM_MEMBERS.filter((m) => m.team === g.key) })),
        { key: 'other', en: 'MEMBERS', ja: 'その他', members: TEAM_MEMBERS.filter((m) => !m.team || !TEAM_GROUPS.some((g) => g.key === m.team)) },
      ].filter((g) => g.members.length)
    : [{ key: 'all', en: '', ja: '', members: TEAM_MEMBERS }];

  return (
    <section id="team" ref={ref} className="tm" aria-labelledby="pg-title">
      {TEAM_MEMBERS.length === 0 ? (
        <ul className="tm__grid" aria-label="運営メンバー（準備中）">
          <PlaceholderCard first />
          <PlaceholderCard />
          <PlaceholderCard />
          <PlaceholderCard />
        </ul>
      ) : (
        sections.map((g) => (
          <div key={g.key} className="tm__group">
            {g.en && (
              <h2 className="tm__group-title">
                <span className="tm__group-en">{g.en}</span>
                <span className="tm__group-ja">{g.ja}</span>
              </h2>
            )}
            <ul className="tm__grid">
              {g.members.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </ul>
          </div>
        ))
      )}

      <aside className="tm__contact" aria-labelledby="tm-contact-title">
        <p className="eyebrow">Contact</p>
        <h2 id="tm-contact-title" className="tm__contact-title">
          運営へのお問い合わせ
        </h2>
        <p className="tm__contact-text">NEWTONE 2027 についてのご質問・ご相談は、お問い合わせフォームからお送りください。</p>
        <Link to="/contact#contact-form" className="cta tm__contact-cta">
          <span>お問い合わせフォームへ</span>
          <ArrowRight className="cta__arrow" />
        </Link>
        <p className="tm__org">Organized by ARQO</p>
      </aside>
    </section>
  );
};
