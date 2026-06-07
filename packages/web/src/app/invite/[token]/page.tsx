"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Edit3,
  Eye,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  LogIn,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

interface InvitationInfo {
  workspaceId: string;
  workspaceName: string;
  role: string;
  email: string;
}

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [token, setToken] = useState<string>("");
  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState<"loading" | "valid" | "expired" | "accepted" | "not_found" | "error">("loading");

  // Resolve params
  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  // Validate invitation
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/team/invitation/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 404) setStatus("not_found");
          else setStatus("error");
          setError(data.error || "Failed to load invitation");
          return;
        }
        if (!data.valid) {
          if (data.reason === "expired") setStatus("expired");
          else if (data.reason === "already_accepted") setStatus("accepted");
          setInvitation(data.invitation);
          return;
        }
        setStatus("valid");
        setInvitation(data.invitation);
      })
      .catch(() => {
        setStatus("error");
        setError("Network error. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Accept invitation
  const handleAccept = useCallback(async () => {
    setAccepting(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError("Please log in first.");
        setAccepting(false);
        return;
      }

      const res = await fetch(`/api/team/invitation/${token}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        // Redirect to dashboard after 2s
        setTimeout(() => router.push("/dashboard"), 2000);
      } else {
        setError(data.error || "Failed to accept invitation.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAccepting(false);
    }
  }, [token, router]);

  const handleLogin = () => {
    const returnUrl = encodeURIComponent(`/invite/${token}`);
    router.push(`/login?returnUrl=${returnUrl}`);
  };

  const roleIcon =
    invitation?.role === "admin" ? (
      <Shield className="h-5 w-5 text-[var(--color-accent)]" />
    ) : invitation?.role === "editor" ? (
      <Edit3 className="h-5 w-5 text-[var(--color-primary-light)]" />
    ) : (
      <Eye className="h-5 w-5 text-[var(--color-on-dark-soft)]" />
    );

  return (
    <div className="min-h-screen bg-[var(--color-surface-dark)] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-xl p-6">
        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-primary-light)]" />
            <p className="mt-3 text-body-sm text-[var(--color-on-dark-soft)]">Loading invitation…</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-[var(--color-success)]" />
            <h2 className="mt-4 font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
              Welcome to {invitation?.workspaceName}!
            </h2>
            <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">
              You are now a {invitation?.role}. Redirecting to dashboard…
            </p>
          </div>
        )}

        {/* Error state */}
        {status === "error" && (
          <div className="text-center py-8">
            <XCircle className="mx-auto h-12 w-12 text-[var(--color-error)]" />
            <h2 className="mt-4 font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
              Something went wrong
            </h2>
            <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-caption font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Not found */}
        {status === "not_found" && (
          <div className="text-center py-8">
            <XCircle className="mx-auto h-12 w-12 text-[var(--color-on-dark-muted)]" />
            <h2 className="mt-4 font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
              Invitation Not Found
            </h2>
            <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">
              This invitation link is invalid or has been removed.
            </p>
          </div>
        )}

        {/* Expired */}
        {status === "expired" && (
          <div className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-[var(--color-warning)]" />
            <h2 className="mt-4 font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
              Invitation Expired
            </h2>
            <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">
              This invitation for {invitation?.workspaceName} has expired. Please ask the workspace admin to send a new invitation.
            </p>
          </div>
        )}

        {/* Already accepted */}
        {status === "accepted" && (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-[var(--color-info)]" />
            <h2 className="mt-4 font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
              Already Joined
            </h2>
            <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">
              You have already accepted this invitation to {invitation?.workspaceName}.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Valid invitation */}
        {status === "valid" && invitation && (
          <>
            <div className="text-center mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 mx-auto mb-3">
                {roleIcon}
              </div>
              <h2 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
                Join {invitation.workspaceName}
              </h2>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                You have been invited to join as{" "}
                <span className="font-semibold capitalize">{invitation.role}</span>
              </p>
              <p className="mt-0.5 text-caption text-[var(--color-on-dark-muted)]">
                {invitation.email}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-caption text-[var(--color-error)] flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
              </div>
            )}

            {!isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-caption text-center text-[var(--color-on-dark-muted)]">
                  You need to log in with {invitation.email} to accept this invitation.
                </p>
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  <LogIn className="h-4 w-4" /> Log In to Accept
                </button>
              </div>
            ) : (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
              >
                {accepting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Accept Invitation
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
