"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, Smartphone, Download } from "lucide-react";
import { KometLogo } from "@/components/ui/komet-logo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallBanner() {
  const t = useTranslations("pwaBanner");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    const installedCheck = setTimeout(() => {
      setShowBanner(false);
    }, 10000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(installedCheck);
    };
  }, []);

  if (isStandalone || !showBanner || dismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 md:bottom-6 md:left-auto md:right-6 md:w-96">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 shadow-2xl shadow-black/50">
        {/* Glow */}
        <div className="pointer-events-none absolute -left-4 -top-4 h-24 w-24 rounded-full bg-[var(--color-primary)]/20 blur-2xl" />

        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded-lg p-1 text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
          aria-label={t("dismiss")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-start gap-3">
          <KometLogo size="md" className="h-10 w-10 rounded-xl shadow-lg shadow-[var(--color-primary)]/25" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-[var(--color-primary)]" />
              <p className="text-sm font-semibold text-white">{t("heading")}</p>
            </div>
            <p className="mt-1 text-xs text-white/60 leading-relaxed">
              {t("description")}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-primary-hover)] transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                {t("install")}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="rounded-lg border border-white/10 px-3.5 py-1.5 text-xs text-white/50 hover:bg-white/5 hover:text-white/70 transition-all"
              >
                {t("notNow")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
