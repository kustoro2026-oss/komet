"use client";
import { PageShell } from "@/components/page-shell";
import { BookOpen, FileText, Code2, Cpu, Terminal, Puzzle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const sections = [
  {
    icon: FileText,
    title: "Getting Started",
    desc: "Learn how to connect your first social account and publish your first post in under 5 minutes.",
    href: "/docs",
  },
  {
    icon: Code2,
    title: "API Reference",
    desc: "Full REST API documentation with code examples. Integrate Komet into your custom workflows.",
    href: "/docs/api",
  },
  {
    icon: Cpu,
    title: "MCP Server",
    desc: "Connect Komet to any MCP-compatible AI agent for automated scheduling, analytics, and replies.",
    href: "/docs",
  },
  {
    icon: Terminal,
    title: "Webhooks",
    desc: "Set up real-time event notifications for new comments, published posts, and analytics updates.",
    href: "/docs",
  },
  {
    icon: Puzzle,
    title: "Integrations",
    desc: "Browse our 15+ social platform integrations and set up OAuth connections easily.",
    href: "/integrations",
  },
];

export default function DocsPage() {
  return (
    <PageShell title="Documentation" description="Everything you need to master Komet.">
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
            >
              <Link
                href={s.href}
                className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/15 transition-colors">
                  <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-semibold text-[var(--color-on-dark)] text-sm sm:text-base">{s.title}</h3>
                <p className="mt-1.5 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{s.desc}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </PageShell>
  );
}
