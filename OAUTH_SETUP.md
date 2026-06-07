# OAuth Setup Guide — Komet

Panduan lengkap cara mendapatkan **Client ID** dan **Client Secret** (atau Bot Token) untuk setiap platform sosial media Komet.

**Redirect URI yang harus didaftarkan di tiap platform:**
```
https://kontenmumelesat.com/api/oauth/callback
```

---

## 1. Twitter / X

**URL:** https://developer.x.com/en/portal/dashboard

1. Buat project di developer portal
2. Masuk ke **Keys and Tokens**
3. Di bagian **OAuth 2.0 Client ID**, klik **Generate**
4. Copy **Client ID** dan **Client Secret**
5. Buka **User Authentication Settings**:
   - Set **App Permissions** → `Read and Write`
   - Set **Allowed Redirect URLs** → `https://kontenmumelesat.com/api/oauth/callback`
   - Pilih **Confidential Client**
   - Centang **Enable PKCE**

```
TWITTER_CLIENT_ID=client_id_disini
TWITTER_CLIENT_SECRET=client_secret_disini
```

---

## 2. Instagram (Instagram Login — standalone, no Facebook required)

**URL:** https://developers.facebook.com/apps/

1. Klik **Create App** → pilih **Business** → isi nama app
2. Klik **Add Product** → pilih **Instagram Platform**
3. Pilih **Instagram API with Instagram Login**
4. Di **Business Login settings**, copy **Instagram App ID** dan **Instagram App Secret**
5. **OAuth redirect URIs** → tambah `https://kontenmumelesat.com/api/oauth/callback`
6. Scopes yang perlu diaktifkan:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
   - `instagram_business_manage_comments`

> ⚠️ **Syarat:** Akun Instagram harus **Business/Creator** (professional account), bukan personal.

```
INSTAGRAM_CLIENT_ID=instagram_app_id_disini
INSTAGRAM_CLIENT_SECRET=instagram_app_secret_disini
```

---

## 3. Facebook (Facebook Login + Pages API)

**URL:** https://developers.facebook.com/apps/

1. Bisa pakai Meta app yang sama dengan Instagram
2. Tambah product **Facebook Login**
3. **Settings** → **Basic** → copy **App ID** dan **App Secret**
4. **Facebook Login** → **Settings** → **Valid OAuth Redirect URIs** → tambah `https://kontenmumelesat.com/api/oauth/callback`

```
FACEBOOK_CLIENT_ID=facebook_app_id_disini
FACEBOOK_CLIENT_SECRET=facebook_app_secret_disini
```

---

## 4. LinkedIn

**URL:** https://www.linkedin.com/developers/apps

1. Klik **Create App**
2. Isi nama, pilih **LinkedIn Page** (harus punya LinkedIn Page sebagai verifikasi)
3. Setuju **Legal Agreement**
4. **Auth** tab → copy **Client ID** dan **Client Secret**
5. **OAuth 2.0 settings** → tambah **Redirect URLs**:
   `https://kontenmumelesat.com/api/oauth/callback`
6. **Products** → add **"Sign In with LinkedIn using OpenID Connect"** (wajib)
7. Jika perlu posting, tambah juga **"Share on LinkedIn"**

```
LINKEDIN_CLIENT_ID=client_id_disini
LINKEDIN_CLIENT_SECRET=client_secret_disini
```

---

## 5. YouTube (Google OAuth)

**URL:** https://console.cloud.google.com/

1. Buat project baru (atau pilih existing)
2. **APIs & Services** → **Library** → cari & enable **YouTube Data API v3**
3. **Credentials** → **Create Credentials** → **OAuth Client ID**
4. **Application type** → **Web application**
5. **Authorized redirect URIs** → tambah `https://kontenmumelesat.com/api/oauth/callback`
6. Copy **Client ID** dan **Client Secret**
7. **OAuth Consent Screen** → tambah Scopes:
   - `https://www.googleapis.com/auth/youtube`
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`

```
YOUTUBE_CLIENT_ID=client_id_disini
YOUTUBE_CLIENT_SECRET=client_secret_disini
```

---

## 6. Threads (Meta / Threads API)

**URL:** https://developers.facebook.com/apps/

1. Bisa pakai Meta app yang sama dengan Instagram/Facebook
2. Tambah product **Threads** → **Set Up**
3. **Threads API** → **Basic Settings** → copy **Threads App ID** dan **Threads App Secret**
4. **OAuth redirect URIs** → tambah `https://kontenmumelesat.com/api/oauth/callback`

```
THREADS_CLIENT_ID=threads_app_id_disini
THREADS_CLIENT_SECRET=threads_app_secret_disini
```

---

## 7. TikTok

**URL:** https://developers.tiktok.com/

1. Klik **Create App** (atau **Manage Apps** → **Create App**)
2. **Platform** → pilih **Web**
3. **Redirect URI** → tambah `https://kontenmumelesat.com/api/oauth/callback`
4. Copy **Client Key** (ini adalah CLIENT_ID) dan **Client Secret**

```
TIKTOK_CLIENT_ID=client_key_disini
TIKTOK_CLIENT_SECRET=client_secret_disini
```

---

## 8. Pinterest

**URL:** https://developers.pinterest.com/

1. Klik **Create App** → isi nama, deskripsi
2. **App Dashboard** → copy **App ID** dan **App Secret**
3. **Redirect URIs** → tambah `https://kontenmumelesat.com/api/oauth/callback`
4. Apply scopes: `boards:read`, `boards:write`, `pins:read`, `pins:write`, `user_accounts:read`

```
PINTEREST_CLIENT_ID=app_id_disini
PINTEREST_CLIENT_SECRET=app_secret_disini
```

---

## 9. Reddit

**URL:** https://www.reddit.com/prefs/apps

1. Di bagian bawah halaman, klik **Create App** atau **are you a developer? create an app...**
2. **Name** → nama aplikasi
3. **Type** → pilih **web app**
4. **redirect uri** → `https://kontenmumelesat.com/api/oauth/callback`
5. Setelah create, lihat **Client ID** (text kecil di bawah app name) dan **secret**

```
REDDIT_CLIENT_ID=client_id_disini
REDDIT_CLIENT_SECRET=secret_disini
```

---

## 10. Discord

**URL:** https://discord.com/developers/applications

1. Klik **New Application** → isi nama
2. **OAuth2** sidebar → copy **Client ID** dan **Client Secret**
3. **Redirects** → tambah `https://kontenmumelesat.com/api/oauth/callback`

```
DISCORD_CLIENT_ID=client_id_disini
DISCORD_CLIENT_SECRET=client_secret_disini
```

---

## 11. Snapchat

**URL:** https://developers.snap.com/

1. **Snap Kit** portal → **Create App**
2. Di **Login Kit** → copy **OAuth2 Client ID** (ini CLIENT_ID) dan **Client Secret**
3. **Redirect URIs** → tambah `https://kontenmumelesat.com/api/oauth/callback`

> Ada 2 Client ID (Production + Staging), pakai yang **Production**.

```
SNAPCHAT_CLIENT_ID=oauth2_client_id_disini
SNAPCHAT_CLIENT_SECRET=client_secret_disini
```

---

## 12. Google Business Profile (Google OAuth)

**URL:** https://console.cloud.google.com/

1. Pakai Google Cloud project yang sama dengan YouTube
2. **APIs & Services** → **Library** → enable **Google Business Profile API**
3. Bisa pakai **OAuth Client ID** yang sudah dibuat untuk YouTube
4. Kalau belum ada, **Credentials** → **Create Credentials** → **OAuth Client ID** → **Web application**
5. **Authorized redirect URIs** → `https://kontenmumelesat.com/api/oauth/callback`
6. **OAuth Consent Screen** → tambah scope: `https://www.googleapis.com/auth/business.manage`

```
GOOGLE_BUSINESS_CLIENT_ID=client_id_disini
GOOGLE_BUSINESS_CLIENT_SECRET=client_secret_disini
```

---

## 13. WhatsApp Business (Meta / WhatsApp Cloud API)

**URL:** https://developers.facebook.com/apps/

1. Bisa pakai Meta app yang sama (yg sudah ada Instagram/Facebook/Threads)
2. Tambah product **WhatsApp API**
3. **API Setup** → copy **Permanent Access Token** → ini jadi **Client Secret**
4. **App ID** dari Meta App → jadi **Client ID**

WhatsApp butuh **System User Token** dari **Business Manager**:
1. Buka https://business.facebook.com/
2. **Business Settings** → **Users** → **System Users**
3. **Add** → isi nama, centang **Admin** → **Create**
4. Klik **Assign Assets** → pilih WhatsApp app → **Manage App** → **Full Control**
5. Klik **Generate Token** → pilih scopes → **Generate**
6. Copy token yang muncul

```
WHATSAPP_CLIENT_ID=meta_app_id_disini
WHATSAPP_CLIENT_SECRET=permanent_access_token_disini
```

---

## 14. Telegram Bot (token only, no OAuth)

Telegram tidak pakai OAuth 2.0, cukup Bot Token.

**Cara dapat Bot Token:**
1. Buka Telegram → cari **@BotFather**
2. Kirim perintah: `/newbot`
3. Ikuti instruksi (nama bot, username — harus diakhiri `bot`, misal `komet_bot`)
4. Setelah selesai, BotFather akan kasih token seperti:
   ```
   123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
   ```
5. Copy token itu

```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

---

## Setelah Semua Terisi

1. Copy env vars ke **Vercel Dashboard**:
   - Buka https://vercel.com/
   - **Project** → **Settings** → **Environment Variables**
   - Tambah satu per satu (atau pakai `vercel env add` CLI)

2. Deploy ulang:
   ```bash
   git add .
   git commit -m "feat: configure OAuth credentials"
   git push
   ```

3. Vercel otomatis redeploy.
