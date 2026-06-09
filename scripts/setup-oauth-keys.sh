#!/bin/bash
# Komet OAuth Key Setup Helper
# Usage: bash scripts/setup-oauth-keys.sh
# Saves credentials to .env file

set -e

ENV_FILE=".env"
BACKUP_FILE=".env.backup.$(date +%s)"

# Backup existing .env
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$BACKUP_FILE"
  echo "✓ Backed up existing .env to $BACKUP_FILE"
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║     KOMET - OAuth Key Setup                 ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Masukkan Client ID & Client Secret untuk setiap platform."
echo "Kosongkan untuk skip."
echo ""

# Function to set/update env var
set_env() {
  local key="$1"
  local label="$2"
  
  echo "─── $label ───"
  read -p "  Client ID: " client_id
  read -p "  Client Secret: " client_secret
  
  if [ -n "$client_id" ]; then
    # Remove existing line if present
    sed -i "/^${key}_CLIENT_ID=/d" "$ENV_FILE" 2>/dev/null || true
    sed -i "/^${key}_CLIENT_SECRET=/d" "$ENV_FILE" 2>/dev/null || true
    echo "${key}_CLIENT_ID=$client_id" >> "$ENV_FILE"
    echo "${key}_CLIENT_SECRET=$client_secret" >> "$ENV_FILE"
    echo "  ✓ Saved"
  else
    echo "  ⊘ Skipped"
  fi
  echo ""
}

# Twitter/X
echo "═══════════════════════════════════════════"
echo "  TWITTER / X"
echo "  Buka: https://developer.x.com/en/portal/dashboard"
echo "  Login → Projects & Apps → Keys & Tokens"
echo "  Enable OAuth 2.0, set callback:"
echo "  https://kontenmumelesat.com/api/oauth/callback"
echo "═══════════════════════════════════════════"
set_env "TWITTER" "Twitter/X"

# Reddit
echo "═══════════════════════════════════════════"
echo "  REDDIT"
echo "  Buka: https://www.reddit.com/prefs/apps"
echo "  Create App → type: 'web app'"
echo "  Redirect URI: https://kontenmumelesat.com/api/oauth/callback"
echo "═══════════════════════════════════════════"
set_env "REDDIT" "Reddit"

# Discord
echo "═══════════════════════════════════════════"
echo "  DISCORD"
echo "  Buka: https://discord.com/developers/applications"
echo "  New Application → OAuth2 → Redirects:"
echo "  https://kontenmumelesat.com/api/oauth/callback"
echo "═══════════════════════════════════════════"
set_env "DISCORD" "Discord"

# Facebook (Meta)
echo "═══════════════════════════════════════════"
echo "  FACEBOOK / META (Instagram + Threads juga)"
echo "  Buka: https://developers.facebook.com/apps"
echo "  Create App → type: 'Consumer'"
echo "  Products: Facebook Login, Instagram Basic Display"
echo "  OAuth Redirect: https://kontenmumelesat.com/api/oauth/callback"
echo "═══════════════════════════════════════════"
set_env "FACEBOOK" "Facebook"

echo "═══════════════════════════════════════════"
echo "  INSTAGRAM"
echo "  (Gunakan App ID Facebook yg sama)"
echo "  Di Facebook App → Instagram Basic Display →"
echo "  Create new Instagram App ID"
echo "═══════════════════════════════════════════"
set_env "INSTAGRAM" "Instagram"

echo "═══════════════════════════════════════════"
echo "  THREADS"
echo "  (Gunakan App ID Facebook yg sama)"
echo "  Di Facebook App → Threads API"
echo "═══════════════════════════════════════════"
set_env "THREADS" "Threads"

# YouTube (Google)
echo "═══════════════════════════════════════════"
echo "  YOUTUBE (Google Cloud)"
echo "  Buka: https://console.cloud.google.com/apis/credentials"
echo "  Create OAuth 2.0 Client ID → type: 'Web application'"
echo "  Redirect: https://kontenmumelesat.com/api/oauth/callback"
echo "  Scope: YouTube Data API v3"
echo "═══════════════════════════════════════════"
set_env "YOUTUBE" "YouTube"

# LinkedIn
echo "═══════════════════════════════════════════"
echo "  LINKEDIN"
echo "  Buka: https://www.linkedin.com/developers/apps"
echo "  Create App → Products: Share on LinkedIn, Sign in"
echo "  Redirect: https://kontenmumelesat.com/api/oauth/callback"
echo "  ⚠️  Perlu review 2-7 hari"
echo "═══════════════════════════════════════════"
set_env "LINKEDIN" "LinkedIn"

# TikTok
echo "═══════════════════════════════════════════"
echo "  TIKTOK"
echo "  Buka: https://developers.tiktok.com/apps"
echo "  Create App → Redirect: https://kontenmumelesat.com/api/oauth/callback"
echo "  ⚠️  Perlu review"
echo "═══════════════════════════════════════════"
set_env "TIKTOK" "TikTok"

# Pinterest
echo "═══════════════════════════════════════════"
echo "  PINTEREST"
echo "  Buka: https://developers.pinterest.com/apps"
echo "  Create App → Redirect: https://kontenmumelesat.com/api/oauth/callback"
echo "  ⚠️  Perlu approval"
echo "═══════════════════════════════════════════"
set_env "PINTEREST" "Pinterest"

# Snapchat
echo "═══════════════════════════════════════════"
echo "  SNAPCHAT"
echo "  Buka: https://developers.snapchat.com"
echo "  Create App → Redirect: https://kontenmumelesat.com/api/oauth/callback"
echo "  ⚠️  Perlu review ketat"
echo "═══════════════════════════════════════════"
set_env "SNAPCHAT" "Snapchat"

# Telegram
echo "═══════════════════════════════════════════"
echo "  TELEGRAM"
echo "  Buka: https://t.me/BotFather"
echo "  /newbot → pilih nama → dapat token"
echo "═══════════════════════════════════════════"
read -p "  Bot Token: " bot_token
if [ -n "$bot_token" ]; then
  sed -i "/^TELEGRAM_BOT_TOKEN=/d" "$ENV_FILE" 2>/dev/null || true
  echo "TELEGRAM_BOT_TOKEN=$bot_token" >> "$ENV_FILE"
  echo "  ✓ Saved"
else
  echo "  ⊘ Skipped"
fi

echo "═══════════════════════════════════════════"
echo "  SELESAI!"
echo "  Credentials disimpan di .env"
echo "  Restart server: pnpm dev"
echo "═══════════════════════════════════════════"
