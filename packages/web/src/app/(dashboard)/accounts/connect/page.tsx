"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ExternalLink, Check, Loader2, Search, Shield, Globe, MessageSquare, Video, ChevronRight, X, RefreshCw, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS, SUPPORTED_PLATFORMS } from "@komet/shared";
import { useProfiles, useAccounts } from "@/lib/accounts/hooks";
import { startOAuth, connectBluesky } from "@/lib/accounts/connect";
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

  // Telegram-specific form (multi-step: phone -> code -> 2FA -> chats)
  const [telegramStep, setTelegramStep] = useState<"phone" | "code" | "2fa" | "chats">("phone");
  const [telegramPhone, setTelegramPhone] = useState("");
  const [telegramCode, setTelegramCode] = useState("");
  const [telegramPassword, setTelegramPassword] = useState("");
  const [telegramSessionId, setTelegramSessionId] = useState("");
  const [telegramChats, setTelegramChats] = useState<Array<{ id: string; name: string; type: string; username?: string }>>([]);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramAccountId, setTelegramAccountId] = useState("");

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

  const sendTelegramCode = async () => {
    if (!telegramPhone || !profileId) return;
    setConnecting(true);
    setError("");

    try {
      const res = await fetch("/api/accounts/connect/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "sendCode", phoneNumber: telegramPhone, profileId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }

      if (data.sessionId) {
        setTelegramSessionId(data.sessionId);
        setTelegramStep("code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setConnecting(false);
    }
  };

  const verifyTelegramCode = async () => {
    if (!telegramCode || !telegramSessionId) return;
    setConnecting(true);
    setError("");

    try {
      const res = await fetch("/api/accounts/connect/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verifyCode", sessionId: telegramSessionId, phoneCode: telegramCode, profileId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid code");
        return;
      }

      if (data.needs2FA) {
        setTelegramStep("2fa");
      } else if (data.connected && data.id) {
        setTelegramAccountId(data.id);
        setTelegramStep("chats");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setConnecting(false);
    }
  };

  const verifyTelegramPassword = async () => {
    if (!telegramPassword || !telegramSessionId) return;
    setConnecting(true);
    setError("");

    try {
      const res = await fetch("/api/accounts/connect/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "verifyPassword", sessionId: telegramSessionId, password: telegramPassword, profileId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid password");
        return;
      }

      if (data.connected && data.id) {
        setTelegramAccountId(data.id);
        setTelegramStep("chats");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid password");
    } finally {
      setConnecting(false);
    }
  };

  const fetchTelegramChats = async () => {
    if (!telegramAccountId) return;
    setConnecting(true);
    setError("");

    try {
      const res = await fetch(`/api/accounts/connect/telegram/chats?accountId=${encodeURIComponent(telegramAccountId)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch chats");
        return;
      }

      if (data.chats && data.chats.length > 0) {
        setTelegramChats(data.chats);
        setTelegramChatId(data.chats[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch chats");
    } finally {
      setConnecting(false);
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
        // Telegram uses multi-step login — handled inline in the UI
        // The "Connect" button is only for non-telegram platforms
        setConnecting(false);
        return;
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
            onClick={() => { setSelectedPlatform(null); setConnected(false); setBlueskyIdentifier(""); setBlueskyAppPassword(""); setTelegramStep("phone"); setTelegramPhone(""); setTelegramCode(""); setTelegramPassword(""); setTelegramSessionId(""); setTelegramChats([]); setTelegramChatId(""); setTelegramAccountId(""); }}
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
            setTelegramStep("phone");
            setTelegramPhone("");
            setTelegramCode("");
            setTelegramPassword("");
            setTelegramSessionId("");
            setTelegramChats([]);
            setTelegramChatId("");
            setTelegramAccountId("");
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
                {/* Step 0: Phone number */}
                {telegramStep === "phone" && (
                  <>
                    <div className="rounded-xl bg-[var(--color-primary)]/[0.06] border border-[var(--color-primary)]/10 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                          <MessageSquare className="h-4 w-4 text-[var(--color-primary-light)]" />
                        </div>
                        <div>
                          <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                            {t("telegramLoginTitle") || "Log in with Telegram"}
                          </p>
                          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                            {t("telegramLoginDesc") || "Enter your phone number to receive a verification code on Telegram."}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                        {t("telegramPhoneLabel") || "Phone Number"}
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={telegramPhone}
                          onChange={(e) => setTelegramPhone(e.target.value)}
                          placeholder={t("telegramPhonePlaceholder") || "+6281234567890"}
                          onKeyDown={(e) => { if (e.key === "Enter") sendTelegramCode(); }}
                          className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-10 pr-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                        />
                        <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                      </div>
                      <p className="mt-2 flex items-start gap-1.5 text-caption text-[var(--color-on-dark-muted)]">
                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {t("telegramPhoneHint") || "Use international format with country code (e.g. +62 for Indonesia)"}
                      </p>
                    </div>
                  </>
                )}

                {/* Step 1: Verification code */}
                {telegramStep === "code" && (
                  <>
                    <div className="rounded-xl bg-[var(--color-primary)]/[0.06] border border-[var(--color-primary)]/10 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                          <Shield className="h-4 w-4 text-[var(--color-primary-light)]" />
                        </div>
                        <div>
                          <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                            {t("telegramCodeTitle") || "Verification Code"}
                          </p>
                          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                            {t("telegramCodeSentTo") || "A code was sent to {phone}", { phone: telegramPhone }}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                        {t("telegramCodeLabel") || "Code"}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={8}
                          value={telegramCode}
                          onChange={(e) => setTelegramCode(e.target.value)}
                          placeholder="12345"
                          onKeyDown={(e) => { if (e.key === "Enter") verifyTelegramCode(); }}
                          className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-10 pr-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-all"
                        />
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                      </div>
                      <button
                        onClick={() => { setTelegramStep("phone"); setTelegramCode(""); }}
                        className="mt-2 text-caption text-[var(--color-primary-light)] hover:underline"
                      >
                        {t("telegramBackToPhone") || "Back to phone number"}
                      </button>
                    </div>
                  </>
                )}

                {/* Step 2: 2FA Password */}
                {telegramStep === "2fa" && (
                  <>
                    <div className="rounded-xl bg-[var(--color-warning)]/[0.06] border border-[var(--color-warning)]/10 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning)]/10">
                          <Shield className="h-4 w-4 text-[var(--color-warning)]" />
                        </div>
                        <div>
                          <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                            {t("telegram2faTitle") || "Two-Factor Authentication"}
                          </p>
                          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                            {t("telegram2faDesc") || "Your account has 2FA enabled. Enter your password to continue."}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning)]" />
                        {t("telegram2faLabel") || "Password"}
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={telegramPassword}
                          onChange={(e) => setTelegramPassword(e.target.value)}
                          placeholder="Enter your 2FA password"
                          onKeyDown={(e) => { if (e.key === "Enter") verifyTelegramPassword(); }}
                          className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-10 pr-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-warning)]/50 focus:border-[var(--color-warning)] transition-all"
                        />
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                      </div>
                    </div>
                  </>
                )}

                {/* Step 3: Chat selection */}
                {telegramStep === "chats" && (
                  <>
                    <div className="rounded-xl bg-[var(--color-success)]/[0.06] border border-[var(--color-success)]/10 p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/10">
                          <Check className="h-4 w-4 text-[var(--color-success)]" />
                        </div>
                        <div>
                          <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                            {t("telegramLoggedIn") || "Logged In"}
                          </p>
                          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                            {t("telegramSelectChat") || "Select where your posts will be sent."}
                          </p>
                        </div>
                      </div>
                    </div>

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
                      <button
                        onClick={fetchTelegramChats}
                        disabled={connecting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-4 py-2.5 text-button-sm font-medium text-[var(--color-success)] hover:bg-[var(--color-success)]/20 transition-all disabled:opacity-50"
                      >
                        {connecting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("telegramFetchingChats") || "Fetching chats..."}
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            {t("telegramFetchChats") || "Fetch My Chats"}
                          </>
                        )}
                      </button>
                    )}
                  </>
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

            {/* Step action buttons */}
            {isTelegram ? (
              <>
                {telegramStep === "phone" && (
                  <button
                    onClick={sendTelegramCode}
                    disabled={connecting || !profileId || !telegramPhone}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-button-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    style={{ backgroundColor: PLATFORM_COLORS[selectedPlatform] }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
                  >
                    {connecting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{t("telegramSendingCode") || "Sending code..."}</>
                    ) : (
                      <><MessageSquare className="h-4 w-4" />{t("telegramSendCode") || "Send Code"}</>
                    )}
                  </button>
                )}
                {telegramStep === "code" && (
                  <button
                    onClick={verifyTelegramCode}
                    disabled={connecting || !telegramCode}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-button-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    style={{ backgroundColor: PLATFORM_COLORS[selectedPlatform] }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
                  >
                    {connecting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{t("telegramVerifying") || "Verifying..."}</>
                    ) : (
                      <><Check className="h-4 w-4" />{t("telegramVerify") || "Verify Code"}</>
                    )}
                  </button>
                )}
                {telegramStep === "2fa" && (
                  <button
                    onClick={verifyTelegramPassword}
                    disabled={connecting || !telegramPassword}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-button-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    style={{ backgroundColor: PLATFORM_COLORS[selectedPlatform] }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
                  >
                    {connecting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{t("telegramVerifying") || "Verifying..."}</>
                    ) : (
                      <><Shield className="h-4 w-4" />{t("telegramVerifyPassword") || "Verify Password"}</>
                    )}
                  </button>
                )}
                {telegramStep === "chats" && (
                  <button
                    onClick={() => setConnected(true)}
                    disabled={connecting || !telegramChatId}
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-button-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    style={{ backgroundColor: PLATFORM_COLORS[selectedPlatform] }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
                  >
                    <>
                      <PlatformIcon platform={selectedPlatform} className="h-4 w-4" />
                      {t("connectPlatform", { platform: PLATFORM_LABELS[selectedPlatform] })}
                    </>
                  </button>
                )}
              </>
            ) : (
              <>
            {/* Submit button */}
            <button
              onClick={handleConnect}
              disabled={
                connecting ||
                !profileId ||
                (isBluesky && (!blueskyIdentifier || !blueskyAppPassword))
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
              </>
            )}
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
