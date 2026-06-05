"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, Check, Info, Loader2 } from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS, SUPPORTED_PLATFORMS } from "@komet/shared";
import { startOAuth, connectBluesky, createProfile } from "@/lib/zernio/api";
import { useProfiles } from "@/lib/zernio/hooks";

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

export default function ConnectAccountPage() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  // Bluesky-specific form
  const [blueskyIdentifier, setBlueskyIdentifier] = useState("");
  const [blueskyAppPassword, setBlueskyAppPassword] = useState("");

  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Auto-create default profile if none exists
  useEffect(() => {
    if (!profilesLoading && profiles) {
      if (profiles.length > 0) {
        setProfileId(profiles[0].id);
      } else {
        // No profiles exist — create one
        createProfile("Default")
          .then((p) => setProfileId(p.id))
          .catch((err: Error) => setError(err.message || "Failed to create profile"));
      }
    }
  }, [profiles, profilesLoading]);

  const handleConnect = async () => {
    if (!selectedPlatform || !profileId) return;
    setConnecting(true);
    setError("");

    try {
      if (selectedPlatform === "bluesky") {
        if (!blueskyIdentifier || !blueskyAppPassword) {
          setError("Please enter your Bluesky identifier and app password");
          setConnecting(false);
          return;
        }
        await connectBluesky(blueskyIdentifier, blueskyAppPassword, profileId);
      } else {
        // OAuth flow: get auth URL from Zernio API and redirect
        const result = await startOAuth(selectedPlatform, profileId, `${window.location.origin}/accounts`);
        if (result.authUrl) {
          window.location.href = result.authUrl;
          return;
        }
      }

      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect account");
    } finally {
      setConnecting(false);
    }
  };

  if (connected) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/20">
          <Check className="h-8 w-8 text-[var(--color-success)]" />
        </div>
        <h2 className="mt-6 font-display text-heading-lg font-semibold text-[var(--color-on-dark)]">
          Account Connected!
        </h2>
        <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">
          Your {selectedPlatform && PLATFORM_LABELS[selectedPlatform]} account has been successfully connected.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="/accounts" className="rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]">
            View Accounts
          </a>
          <button
            onClick={() => { setSelectedPlatform(null); setConnected(false); setBlueskyIdentifier(""); setBlueskyAppPassword(""); }}
            className="rounded-lg border border-[var(--color-ink-muted)] px-6 py-2.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            Connect Another
          </button>
        </div>
      </div>
    );
  }

  if (selectedPlatform) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <button
          onClick={() => setSelectedPlatform(null)}
          className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to platforms
        </button>

        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: PLATFORM_COLORS[selectedPlatform] + "20" }}>
              <span className="text-heading-sm font-bold" style={{ color: PLATFORM_COLORS[selectedPlatform] }}>
                {PLATFORM_LABELS[selectedPlatform][0]}
              </span>
            </div>
            <div>
              <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Connect {PLATFORM_LABELS[selectedPlatform]}
              </h2>
              <p className="text-body-sm text-[var(--color-on-dark-soft)]">
                {selectedPlatform === "bluesky" ? "Enter your Bluesky credentials" : "You'll be redirected to authorize Komet"}
              </p>
            </div>
          </div>

          {selectedPlatform === "bluesky" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">Identifier</label>
                <input
                  type="text"
                  value={blueskyIdentifier}
                  onChange={(e) => setBlueskyIdentifier(e.target.value)}
                  placeholder="your-handle.bsky.social"
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">App Password</label>
                <input
                  type="password"
                  value={blueskyAppPassword}
                  onChange={(e) => setBlueskyAppPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
                <p className="mt-1.5 text-caption text-[var(--color-on-dark-muted)]">
                  Generate an app password in your Bluesky settings &gt; App Passwords
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--color-primary)]/5 p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 shrink-0 text-[var(--color-primary-light)]" />
                <div>
                  <p className="text-body-sm text-[var(--color-on-dark)]">
                    You will be redirected to {PLATFORM_LABELS[selectedPlatform]} to authorize Komet.
                  </p>
                  <p className="mt-1 text-caption text-[var(--color-on-dark-muted)]">
                    After authorization, you&apos;ll be redirected back to your accounts page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-[var(--color-error)]/10 p-3 text-caption text-[var(--color-error)]">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={connecting || !profileId || (selectedPlatform === "bluesky" && (!blueskyIdentifier || !blueskyAppPassword))}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                Connect {PLATFORM_LABELS[selectedPlatform]}
                <ExternalLink className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Connect Account</h1>
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">Choose a platform to connect</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {SUPPORTED_PLATFORMS.map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className="flex flex-col items-center gap-3 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-surface-dark-raised)] transition-all"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: PLATFORM_COLORS[platform] + "15" }}>
              <span className="text-heading-lg font-bold" style={{ color: PLATFORM_COLORS[platform] }}>
                {PLATFORM_LABELS[platform][0]}
              </span>
            </div>
            <span className="text-body-sm font-medium text-[var(--color-on-dark)]">{PLATFORM_LABELS[platform]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
