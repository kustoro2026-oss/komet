"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ExternalLink, Check, Loader2, Search, Shield, Globe, MessageSquare, Video, ChevronRight, X, RefreshCw, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS, SUPPORTED_PLATFORMS } from "@komet/shared";
import { useProfiles, useAccounts } from "@/lib/accounts/hooks";
import { startOAuth, connectBluesky, connectTelegram } from "@/lib/accounts/connect";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORM_COLORS: Record<Platform, string> = {
  twitter: "#1DA1F2",
  instagram: "#E4405F",
  facebook: "#1877F2",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  threads: "#000000",
  tiktok: "#000000",
  pinterest: "#BD081C",
  reddit: "#FF4500",
  bluesky: "#0085FF",
  telegram: "#26A5E4",
  discord: "#5865F2",
  snapchat: "#FFFC00",
  googlebusiness: "#4285F4",
  whatsapp: "#25D366",
};

const PLATFORM_CATEGORIES: { categoryKey: string; icon: typeof Globe; platforms: Platform[] }[] = [
  { categoryKey: "categorySocialMedia", icon: Globe, platforms: ["twitter", "instagram", "facebook", "linkedin", "threads", "pinterest", "reddit", "snapchat"] },
  { categoryKey: "categoryVideoMusic", icon: Video, platforms: ["youtube", "tiktok"] },
  { categoryKey: "categoryMessaging", icon: MessageSquare, platforms: ["telegram", "discord", "whatsapp"] },
  { categoryKey: "categoryBusinessOther", icon: Shield, platforms: ["bluesky", "googlebusiness"] },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ConnectAccountPage() {
  const t = useTranslations("connectAccount");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Bluesky-specific form
  const [blueskyIdentifier, setBlueskyIdentifier] = useState("");
  const [blueskyAppPassword, setBlueskyAppPassword] = useState("");

  // Telegram-specific form
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramChats, setTelegramChats] = useState<Array<{ id: string; name: string; type: string; username?: string }>>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState("");

  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: accountsData } = useAccounts();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Connected platforms set
  const connectedPlatforms = useMemo(() => {
    if (!accountsData) return new Set<string>();
    return new Set(accountsData.map((a) => a.platform));
  }, [accountsData]);

  // Auto-create default profile if none exists
  useEffect(() => {
    if (!profilesLoading && profiles) {
      if (profiles.length > 0) {
        setProfileId(profiles[0].id);
      } else {
        fetch("/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Default" }),
        })
          .then((res) => res.json())
          .then((p) => setProfileId(p.id))
          .catch((err: Error) => setError(err.message || t("errorProfileFailed")));
      }
    }
  }, [profiles, profilesLoading]);

  const discoverChats = async () => {
    if (!telegramBotToken) return;
    setIsDiscovering(true);
    setDiscoverError("");
    setTelegramChats([]);
    setTelegramChatId("");

    try {
      const res = await fetch(`/api/accounts/connect/telegram/chats?botToken=${encodeURIComponent(telegramBotToken)}`);
      const data = await res.json();

      if (!res.ok) {
        setDiscoverError(data.error || "Failed to discover chats");
        return;
      }

      if (data.chats && data.chats.length > 0) {
        setTelegramChats(data.chats);
        // Auto-select the first chat
        setTelegramChatId(data.chats[0].id);
      } else {
        setDiscoverError(t("telegramNoChatsFound") || "No chats found. Open Telegram and send /start to your bot first, then try again.");
      }
    } catch (err) {
      setDiscoverError(err instanceof Error ? err.message : "Failed to discover chats");
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedPlatform || !profileId) return;
    setConnecting(true);
    setError("");

    try {
      if (selectedPlatform === "bluesky") {
        if (!blueskyIdentifier || !blueskyAppPassword) {
          setError(t("errorBlueskyRequired"));
          setConnecting(false);
          return;
        }
        await connectBluesky(blueskyIdentifier, blueskyAppPassword, profileId);
      } else if (selectedPlatform === "telegram") {
        if (!telegramBotToken || !telegramChatId) {
          setError(t("errorTelegramRequired") || "Bot token and Chat ID are required");
          setConnecting(false);
          return;
        }
        await connectTelegram(telegramBotToken, telegramChatId, profileId);
      } else {
        const result = await startOAuth(selectedPlatform, profileId);
        if (result.authUrl) {
          window.location.href = result.authUrl;
          return;
        }
      }

      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorConnectFailed"));
    } finally {
      setConnecting(false);
    }
  };

  // Filter platforms by search
  const filteredPlatforms = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    return SUPPORTED_PLATFORMS.filter(
      (p) =>
        PLATFORM_LABELS[p].toLowerCase().includes(q) ||
        p.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // ========== SUCCESS VIEW ==========
  if (connected) {
    return (
      <motion.div
        className="mx-auto max-w-lg py-12 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            backgroundColor: (selectedPlatform ? PLATFORM_COLORS[selectedPlatform] : "#22c55e") + "20",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Check
            className="h-10 w-10"
            style={{ color: selectedPlatform ? PLATFORM_COLORS[selectedPlatform] : "#22c55e" }}
          />
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-display text-heading-lg font-semibold text-[var(--color-on-dark)]">
            {t("successTitle")}
          </h2>
          <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("successMessage", { platform: selectedPlatform ? PLATFORM_LABELS[selectedPlatform] : "" })}
          </p>
        </motion.div>

        <motion.div
          className="mt-10 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <a
            href="/accounts"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-all active:scale-95 shadow-glow"
          >
            {t("viewAccounts")}
            <ChevronRight className="h-4 w-4" />
          </a>
          <button
            onClick={() => { setSelectedPlatform(null); setConnected(false); setBlueskyIdentifier(""); setBlueskyAppPassword(""); setTelegramBotToken(""); setTelegramChatId(""); setTelegramChats([]); setDiscoverError(""); }}
            className="rounded-lg border border-[var(--color-ink-muted)] px-6 py-2.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-all active:scale-95"
          >
            {t("connectAnother")}
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ========== PLATFORM DETAIL VIEW ==========
  if (selectedPlatform) {
    const isBluesky = selectedPlatform === "bluesky";
    const isTelegram = selectedPlatform === "telegram";
    const isManualConnect = isBluesky || isTelegram;
    return (
      <motion.div
        className="mx-auto max-w-lg"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => {
            setSelectedPlatform(null);
            setError("");
            setBlueskyIdentifier("");
            setBlueskyAppPassword("");
            setTelegramBotToken("");
            setTelegramChatId("");
            setTelegramChats([]);
            setDiscoverError("");
          }}
          className="group inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {t("backToPlatforms")}
        </button>

        <div className="mt-4 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden">
          {/* Platform header */}
          <div className="relative p-6 pb-0">
            <div className="flex items-center gap-4">
              <motion.div
                className="flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ backgroundColor: PLATFORM_COLORS[selectedPlatform] + "18" }}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <PlatformIcon platform={selectedPlatform} className="h-7 w-7" />
              </motion.div>
              <div>
                <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  {t("connectPlatform", { platform: PLATFORM_LABELS[selectedPlatform] })}
                </h2>
                <p className="mt-0.5 text-body-sm text-[var(--color-on-dark-soft)]">
                  {isBluesky
                    ? t("blueskyDescription")
                    : isTelegram
                    ? t("telegramDescription") || "Enter your Telegram Bot Token from @BotFather"
                    : t("oauthDescription", { platform: PLATFORM_LABELS[selectedPlatform] })}
                </p>
              </div>
            </div>

            {/* Platform accent line */}
            <div
              className="mt-5 h-0.5 w-full rounded-full opacity-30"
              style={{ backgroundColor: PLATFORM_COLORS[selectedPlatform] }}
            />
          </div>

          <div className="p-6 space-y-5">
            {isBluesky ? (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                      {t("blueskyIdentifier")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={blueskyIdentifier}
                        onChange={(e) => setBlueskyIdentifier(e.target.value)}
                        placeholder={t("blueskyIdentifierPlaceholder")}
                        className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-10 pr-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-dark-muted)]">
                        @
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                      {t("appPassword")}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={blueskyAppPassword}
                        onChange={(e) => setBlueskyAppPassword(e.target.value)}
                        placeholder={t("appPasswordPlaceholder")}
                        className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-10 pr-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                      />
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                    </div>
                    <p className="mt-2 flex items-start gap-1.5 text-caption text-[var(--color-on-dark-muted)]">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {t("blueskyPasswordHint")}
                    </p>
                  </div>
                </div>
              </>
            ) : isTelegram ? (
              <>
                <div className="rounded-xl bg-[var(--color-primary)]/[0.06] border border-[var(--color-primary)]/10 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                      <MessageSquare className="h-4 w-4 text-[var(--color-primary-light)]" />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                        {t("telegramBotTokenTitle") || "Telegram Bot Token"}
                      </p>
                      <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                        {t("telegramBotTokenDesc") || "Create a bot on Telegram via @BotFather, then paste the bot token below."}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                    {t("telegramBotTokenLabel") || "Bot Token"}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={telegramBotToken}
                      onChange={(e) => { setTelegramBotToken(e.target.value); setTelegramChats([]); setTelegramChatId(""); setDiscoverError(""); }}
                      placeholder={t("telegramBotTokenPlaceholder") || "1234567890:ABCdefGHIjklmNOPqrstUVwxyz"}
                      className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-10 pr-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                    />
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-caption text-[var(--color-on-dark-muted)]">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {t("telegramBotTokenHint") || "Open Telegram, search for @BotFather, send /newbot to create one"}
                  </p>
                </div>

                {/* Discover Chats */}
                <div className="rounded-xl bg-[var(--color-success)]/[0.06] border border-[var(--color-success)]/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/10">
                      <RefreshCw className="h-4 w-4 text-[var(--color-success)]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                        {t("telegramDiscoverTitle") || "Auto-Discover Chat"}
                      </p>
                      <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                        {t("telegramDiscoverHint") || "Open Telegram and send /start to your bot, then click Discover."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={discoverChats}
                    disabled={!telegramBotToken || isDiscovering}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-2.5 text-button-sm font-medium text-[var(--color-success)] hover:bg-[var(--color-success)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDiscovering ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("telegramDiscovering") || "Discovering chats..."}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        {t("telegramDiscoverBtn") || "Discover Chats"}
                      </>
                    )}
                  </button>
                </div>

                {/* Discover error */}
                {discoverError && (
                  <div className="rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 shrink-0 mt-0.5 text-[var(--color-warning)]" />
                      <p className="text-caption text-[var(--color-on-dark-soft)]">{discoverError}</p>
                    </div>
                  </div>
                )}

                {/* Chat dropdown or manual input */}
                {telegramChats.length > 0 ? (
                  <div>
                    <label className="flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                      {t("telegramSelectChatLabel") || "Select Chat"}
                    </label>
                    <div className="relative">
                      <select
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-10 pr-10 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                      >
                        {telegramChats.map((chat) => (
                          <option key={chat.id} value={chat.id}>
                            {chat.name} {chat.username ? `(@${chat.username})` : ""} — {chat.type}
                          </option>
                        ))}
                      </select>
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                    </div>
                    <p className="mt-2 flex items-start gap-1.5 text-caption text-[var(--color-success)]">
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {t("telegramChatSelected", { count: telegramChats.length }) || `Found ${telegramChats.length} chat(s). Post will be sent to the selected chat.`}
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                      {t("telegramChatIdLabel") || "Chat ID"}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        placeholder={t("telegramChatIdPlaceholder") || "-1001234567890"}
                        className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-10 pr-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                      />
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                    </div>
                    <p className="mt-2 flex items-start gap-1.5 text-caption text-[var(--color-on-dark-muted)]">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {t("telegramChatIdHintFallback") || "Or paste a Chat ID manually if you know it (e.g. -1001234567890)"}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl bg-[var(--color-primary)]/[0.06] border border-[var(--color-primary)]/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                    <Shield className="h-4 w-4 text-[var(--color-primary-light)]" />
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                      {t("oauthTitle")}
                    </p>
                    <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                      {t.rich("oauthRedirectText", {
                        platform: PLATFORM_LABELS[selectedPlatform],
                        strong: (chunks) => <strong className="text-[var(--color-on-dark)]">{chunks}</strong>,
                      })}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {[
                        t("permissionReadProfile"),
                        t("permissionPublish"),
                        t("permissionViewMetrics"),
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-caption text-[var(--color-on-dark-muted)]">
                          <Check className="h-3 w-3 text-[var(--color-success)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-caption text-[var(--color-on-dark-soft)] italic">
                      {t("oauthAfterAuthNote")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 p-3 text-caption text-[var(--color-error)]"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <div className="flex items-center gap-2">
                    <X className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              onClick={handleConnect}
              disabled={
                connecting ||
                !profileId ||
                (isBluesky && (!blueskyIdentifier || !blueskyAppPassword)) ||
                (isTelegram && (!telegramBotToken || !telegramChatId))
              }
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-button-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white"
              style={{
                backgroundColor: PLATFORM_COLORS[selectedPlatform],
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = "brightness(1)";
              }}
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("connecting")}
                </>
              ) : (
                <>
                  <PlatformIcon platform={selectedPlatform} className="h-4 w-4" />
                  {t("connectPlatform", { platform: PLATFORM_LABELS[selectedPlatform] })}
                  {!isManualConnect && <ExternalLink className="h-4 w-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ========== PLATFORM LIST VIEW ==========
  return (
    <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            {t("heading")}
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("description")}
          </p>
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] pl-9 pr-8 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Connection count */}
      <motion.div variants={itemAnim} className="flex items-center gap-2 text-caption text-[var(--color-on-dark-muted)]">
        <div className="flex -space-x-1.5">
          {SUPPORTED_PLATFORMS.slice(0, 5).map((p) => (
            <div
              key={p}
              className="h-6 w-6 rounded-full border-2 border-[var(--color-surface-dark)] flex items-center justify-center"
              style={{ backgroundColor: PLATFORM_COLORS[p] + "30" }}
            >
              <PlatformIcon platform={p} className="h-3 w-3" />
            </div>
          ))}
        </div>
        <span>
          {t("platformsCount", { connected: connectedPlatforms.size, total: SUPPORTED_PLATFORMS.length })}
        </span>
      </motion.div>

      {/* Search results or categories */}
      {filteredPlatforms ? (
        <motion.div variants={itemAnim} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filteredPlatforms.length > 0 ? (
            filteredPlatforms.map((platform) => (
              <PlatformCard
                key={platform}
                platform={platform}
                isConnected={connectedPlatforms.has(platform)}
                onSelect={setSelectedPlatform}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-ink-muted)]/20">
                <Search className="h-8 w-8 text-[var(--color-on-dark-muted)]" />
              </div>
              <p className="mt-4 text-body-sm text-[var(--color-on-dark-muted)]">
                {t("noPlatformsFound", { query: searchQuery })}
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-2 text-caption font-medium text-[var(--color-primary-light)] hover:underline"
              >
                {t("clearSearch")}
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        /* Categories */
        <div className="space-y-8">
          {PLATFORM_CATEGORIES.map((category) => (
            <motion.div key={category.categoryKey} variants={itemAnim}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-surface-dark-raised)]">
                  <category.icon className="h-4 w-4 text-[var(--color-on-dark-muted)]" />
                </div>
                <h2 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
                  {t(category.categoryKey)}
                </h2>
                <div className="h-px flex-1 bg-[var(--color-ink-muted)]" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {category.platforms.map((platform) => (
                  <PlatformCard
                    key={platform}
                    platform={platform}
                    isConnected={connectedPlatforms.has(platform)}
                    onSelect={setSelectedPlatform}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ========== Platform Card ==========
function PlatformCard({
  platform,
  isConnected,
  onSelect,
}: {
  platform: Platform;
  isConnected: boolean;
  onSelect: (p: Platform) => void;
}) {
  const t = useTranslations("connectAccount");
  const color = PLATFORM_COLORS[platform];

  return (
    <motion.button
      onClick={() => onSelect(platform)}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex flex-col items-center gap-3 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:shadow-lg hover:shadow-black/20 text-left"
      style={{
        borderColor: isConnected ? `${color}40` : undefined,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-3 right-3 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: color }}
      />

      {/* Connected badge */}
      {isConnected && (
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-medium"
          style={{ backgroundColor: color + "15", color: color }}
        >
          <Check className="h-2.5 w-2.5" />
          {t("connected")}
        </div>
      )}

      {/* Platform icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-110 group-hover:shadow-md"
        style={{
          backgroundColor: color + "12",
          boxShadow: isConnected ? `0 0 0 2px ${color}30` : undefined,
        }}
      >
        <PlatformIcon platform={platform} className="h-7 w-7" />
      </div>

      {/* Platform name */}
      <span className="text-body-sm font-medium text-[var(--color-on-dark)] text-center leading-tight">
        {PLATFORM_LABELS[platform]}
      </span>

      {/* Action hint */}
      <span className="text-micro text-[var(--color-on-dark-muted)] group-hover:text-[var(--color-on-dark-soft)] transition-colors">
        {isConnected ? t("reconnectHint") : t("connectHint")}
      </span>
    </motion.button>
  );
}

// Small inline Info icon for reuse
function Info({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}
