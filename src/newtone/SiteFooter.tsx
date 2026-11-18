import React from 'react';
import { Instagram } from 'lucide-react';
import { SNS } from './site';

const instagram = SNS.find((a) => a.key === 'instagram');

/** 全ページ共通のフッター（トップでは ENTRY 場面の最後に置かれる） */
export const SiteFooter: React.FC = () => (
  <footer className="site-footer">
    <a href="#top" className="site-logo" aria-label="NEWTONE 2027 ページ先頭へ">
      <span className="site-logo__name">NEWTONE</span>
      <span className="site-logo__year">2027</span>
    </a>
    <p className="site-footer__tag">
      DISCOVER. <span className="accent-pink">CONNECT.</span> INSPIRE.
    </p>
    {instagram && (
      <ul className="site-footer__sns">
        <li>
          <a href={instagram.url} target="_blank" rel="noopener noreferrer" aria-label={`${instagram.label} ${instagram.handle}（新しいタブで開きます）`}>
            <Instagram strokeWidth={1.5} aria-hidden="true" />
          </a>
        </li>
      </ul>
    )}
    <p className="site-footer__copy">© NEWTONE 2027 — by NEXT BEAUTY ENTREPRENEURS.</p>
    <p className="site-footer__arqo">Organized by ARQO</p>
  </footer>
);
