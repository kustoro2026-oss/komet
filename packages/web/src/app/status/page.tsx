"use client";
import { PageShell } from "@/components/page-shell";
import { Activity } from "lucide-react";

const services = [
  { name: "Komet Web App", status: "operational", uptime: "99.97%" },
  { name: "API", status: "operational", uptime: "99.99%" },
  { name: "Post Scheduling", status: "operational", uptime: "99.95%" },
  { name: "Analytics Engine", status: "operational", uptime: "99.92%" },
  { name: "Inbox & Reply", status: "operational", uptime: "99.98%" },
  { name: "OAuth Connections", status: "operational", uptime: "99.96%" },
];

export default function StatusPage() {
  return (
    <PageShell title="System Status" description="Current operational status of all Komet services.">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-medium text-emerald-400">All Systems Operational</span>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] divide-y divide-white/[0.06]">
          {services.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-[var(--color-on-dark)]">{s.name}</span>
              </div>
              <span className="text-xs text-[var(--color-on-dark-muted)]">{s.uptime} uptime</span>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
              <Activity className="h-6 w-6 text-[var(--color-primary)]" />
            </div>
          </div>
          <p className="text-sm text-[var(--color-on-dark-soft)]">
            Past 90 days: <span className="text-emerald-500 font-medium">99.99% uptime</span>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
