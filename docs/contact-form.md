# お問い合わせフォームの設定

CONTACT ページ（`/contact`）のフォームは `POST /api/contact`（`api/contact.ts`、Vercel Serverless Function）に送信され、
[Resend](https://resend.com) 経由で運営宛にメールが届きます。環境変数が未設定のあいだは、フォームは
「現在フォームからの送信を受け付けられません。Instagram の DM からご連絡ください」と表示します（API は 503 を返します）。

## 環境変数（3つ）

| 名前 | 必須 | 内容 |
| --- | --- | --- |
| `RESEND_API_KEY` | 必須 | Resend の API キー |
| `CONTACT_TO_EMAIL` | 必須 | 問い合わせの通知先。カンマ区切りで複数指定可（例: `a@example.com,b@example.com`） |
| `CONTACT_FROM_EMAIL` | 任意 | 送信元。未設定なら `NEWTONE 2027 <onboarding@resend.dev>`。独自ドメインを認証したら `NEWTONE 2027 <contact@あなたのドメイン>` の形式で指定 |

値はコードやリポジトリ（公開）に書かず、Vercel にだけ設定してください。

## Vercel への設定手順

1. Vercel のダッシュボードで該当プロジェクトを開く
2. **Settings → Environment Variables** を開く
3. 上の3つの名前と値を追加する（Environment は Production を含めて選択）
4. **再デプロイする**（Deployments → 最新のデプロイの「…」→ Redeploy）。環境変数は再デプロイ後に反映されます

## Resend の準備

1. <https://resend.com> でアカウントを作成する
2. **API Keys** で API キーを作成し、`RESEND_API_KEY` に設定する
3. 送信元について
   - `onboarding@resend.dev`（既定）のままだと、**Resend アカウント自身のメールアドレス宛にしか届きません**。まずはその制限で動作確認できます
   - 任意のアドレス（運営のメールなど）へ届けるには、**Domains** で自分のドメインを追加し、表示された DNS レコード（SPF / DKIM）をドメイン側に登録して認証（Verify）します。認証後、`CONTACT_FROM_EMAIL` にそのドメインのアドレスを設定してください
4. `CONTACT_TO_EMAIL` に通知を受け取るアドレスを設定する

## 動作の仕様

- POST のみ（それ以外は 405）。JSON: `type`, `name`, `organization`, `email`, `phone`, `message`, `consent`, `website`（ハニーポット）, `elapsedMs`（表示から送信までの経過ミリ秒）
- サーバー側でも入力を検証（不正は 400）。ハニーポットが埋まっている、または表示から 3 秒未満の送信は、成功を装って何も送信しません
- 同一 IP からは 10 分に 5 回まで（429）。メモリ上の簡易制限なので、サーバーレス関数のインスタンスごとの best-effort です
- 返信先（Reply-To）は送信者のメールアドレス。運営側でメールに返信すれば送信者へ届きます
- 送信者への自動返信メールは送っていません
- Resend への送信に失敗した場合は 502。ログにはステータスのみを出し、個人情報は記録しません

## ローカルで試す

`vite` の開発サーバーには `/api` がないため、フォームの送信は 404 になり「送信できませんでした」と表示されます。
実際の送信確認は Vercel（Preview / Production）か、`vercel dev` で行ってください。
