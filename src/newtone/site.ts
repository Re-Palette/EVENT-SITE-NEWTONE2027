/**
 * サイト全体の設定。
 * 未確定の情報は null / 空配列のままにしておくと、画面上では「準備中」表示になります。
 * 確定した情報だけを入力してください（架空の日時・会場・受付先は入れないこと）。
 */

export interface NewsEntry {
  /** 例: '2027.01.15' */
  date: string;
  title: string;
  /** 詳細ページや外部記事へのリンク（任意） */
  url?: string;
}

export interface SiteConfig {
  contact: {
    /** 参加・お問い合わせフォームのURL（Googleフォーム等）。未設定なら null */
    entryUrl: string | null;
    /** 問い合わせ用メールアドレス。未設定なら null */
    email: string | null;
  };
  access: {
    /** 会場名。未確定なら null */
    venue: string | null;
    /** 住所・アクセス補足。未確定なら null */
    address: string | null;
    /** 開催日時の表記。未確定なら null */
    schedule: string | null;
  };
  news: NewsEntry[];
}

export const SITE: SiteConfig = {
  contact: {
    entryUrl: null,
    email: null,
  },
  access: {
    venue: null,
    address: null,
    schedule: '8月中旬 開催予定',
  },
  news: [
    { date: '2026.11.16', title: '8月中旬の開催を予定しています。会場は決定次第お知らせします。' },
    { date: '2026.11.16', title: 'インフルエンサーとのイベントなども企画中です。' },
  ],
};

/**
 * 公式SNSアカウント（トップの SNS 場面・CONTACT・フッターで共通利用）。
 * 確定したアカウントだけを載せること。X・YouTube など他のアカウントが確定したら、ここに1行足すだけで全箇所に反映されます
 * （アイコンを足す場合は SnsLinks.tsx の SNS_ICONS に key を追加。未登録の key は汎用アイコンで表示）。
 */
export interface SnsAccount {
  key: string;
  label: string;
  handle: string;
  url: string;
}

export const SNS: SnsAccount[] = [
  { key: 'instagram', label: 'Instagram', handle: '@newtone_2027', url: 'https://www.instagram.com/newtone_2027/' },
];

/**
 * 参加・お問い合わせの窓口。サイト内の CONTACT ページのフォーム（/api/contact → メール送信）へ。
 * ホームの ENTRY 場面の CTA が使う。外部フォームに切り替えたいときは SITE.contact.entryUrl を設定する。
 */
export const CONTACT_HREF = SITE.contact.entryUrl ?? '/contact#contact-form';
/** CONTACT_HREF が外部URL（別タブで開く）か */
export const CONTACT_EXTERNAL = SITE.contact.entryUrl !== null;

/**
 * 上部ナビ＝各ページ（並び順がそのまま上部ナビ・モバイルメニュー・各ページ末尾の「NEXT」の順）。
 * ja は各ページの見出し・ページタイトルで使う（確定している内容だけを書くこと）。
 * 上部ナビの横位置は CSS（newtone.css の .site-nav）が等間隔に配るので、項目を足すだけでよい。
 */
export const NAV_LINKS = [
  { label: 'ABOUT', href: '/about', ja: 'NEWTONEについて' },
  { label: 'PROGRAM', href: '/program', ja: 'プログラム' },
  { label: 'BRANDS', href: '/brands', ja: '参加ブランド' },
  { label: 'PARTNERS', href: '/partners', ja: '協賛・パートナー' },
  { label: 'TEAM', href: '/team', ja: '運営メンバー' },
  { label: 'ACCESS', href: '/access', ja: '開催概要・アクセス' },
  { label: 'NEWS', href: '/news', ja: 'お知らせ' },
  { label: 'CONTACT', href: '/contact', ja: '参加・お問い合わせ' },
] as const;

/** 参考ビジュアル右側のカテゴリー表記と同一の並び */
export const EXPERIENCE_CATEGORIES = [
  { key: 'COSMETICS', copy: '色をまとって、気分をアップデート。', hue: '#ff4fa3' },
  { key: 'SKINCARE', copy: '素肌に、未来のスタンダードを。', hue: '#b98cff' },
  { key: 'HAIRCARE', copy: '髪から始まる、新しいわたし。', hue: '#7a6bff' },
  { key: 'INNERCARE', copy: '内側から、美しさをデザインする。', hue: '#e46bff' },
  { key: 'BEAUTY TOOL', copy: 'テクノロジーで、美容をもっと自由に。', hue: '#5f8bff' },
  { key: 'FRAGRANCE', copy: '香りで、わたしを表現する。', hue: '#ff7ac8' },
  { key: 'AND MORE...', copy: 'まだ名前のない、次の美容へ。', hue: '#9fb6ff' },
] as const;
