import React from 'react';
import { ExternalLink, Instagram, type LucideIcon } from 'lucide-react';
import { SNS } from './site';

/** SNS の key → アイコン。アカウントを増やすときはここにも足す（未登録は汎用アイコン） */
const SNS_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
};

const LEADS: Record<string, string> = {
  instagram: '最新情報はInstagramで発信中',
};

/**
 * 公式SNSのカード一覧。データは site.ts の SNS（唯一の定義元）。
 * トップの SNS 場面と CONTACT で共通利用する。
 */
export const SnsLinks: React.FC<{ className?: string }> = ({ className = '' }) => (
  <ul className={`sns__list ${className}`.trim()}>
    {SNS.map((a) => {
      const Icon = SNS_ICONS[a.key] ?? ExternalLink;
      return (
        <li key={a.key} className="sns__item">
          <a
            className="sns__card"
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${a.label} ${a.handle}（新しいタブで開きます）`}
          >
            <span className="sns__icon" aria-hidden="true">
              <Icon strokeWidth={1.5} />
            </span>
            <span className="sns__body">
              <span className="sns__name">{a.label}</span>
              <span className="sns__handle">{a.handle}</span>
              <span className="sns__lead">{LEADS[a.key] ?? '最新情報を発信中'}</span>
            </span>
            <ExternalLink className="sns__out" strokeWidth={1.5} aria-hidden="true" />
          </a>
        </li>
      );
    })}
  </ul>
);
