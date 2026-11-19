/**
 * 運営メンバーのデータ。紹介してよいと本人が了承したメンバーだけを追加してください。
 * 空の間は「メンバー紹介は近日公開」と表示されます（架空の人物・肩書きは入れないこと）。
 *
 * 写真は public/newtone/team/ に置き、パスで指定します（縦長 4:5 推奨。.webp / .jpg）。
 * 写真がない場合は名前のイニシャルが表示されます。
 *
 *   {
 *     id: 'taro-yamada',          // 重複しない英数字
 *     name: '山田 太郎',
 *     nameEn: 'Taro Yamada',      // 任意
 *     role: '代表',                // 役職・担当（例: 代表 / 広報 / デザイン）
 *     team: 'core',               // 任意。TEAM_GROUPS の key。省略すると「その他」にまとまる
 *     affiliation: '〇〇大学 3年',  // 任意（大学・学年など）
 *     photo: '/newtone/team/taro-yamada.webp', // 任意
 *     bio: '一言紹介（2〜3行まで）', // 任意
 *     sns: { instagram: 'https://www.instagram.com/…', x: 'https://x.com/…' }, // 任意（URLで指定）
 *   }
 */

export type TeamKey = 'core' | 'pr' | 'design';

export interface TeamMember {
  id: string;
  name: string;
  nameEn?: string;
  role: string;
  team?: TeamKey;
  affiliation?: string;
  photo?: string;
  bio?: string;
  sns?: { instagram?: string; x?: string };
}

/** 表示順と見出し。メンバーのいないグループは表示されません。チームを増やすときはここに追加 */
export const TEAM_GROUPS: { key: TeamKey; en: string; ja: string }[] = [
  { key: 'core', en: 'CORE', ja: '運営' },
  { key: 'pr', en: 'PR', ja: '広報' },
  { key: 'design', en: 'DESIGN', ja: 'デザイン' },
];

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'hoshi-haruto', name: '星 晴登', nameEn: 'Hoshi Haruto', role: '共同代表' },
  { id: 'suzuki-haruto', name: '鈴木 陽大', nameEn: 'Suzuki Haruto', role: '共同代表' },
];
