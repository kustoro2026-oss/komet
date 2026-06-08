"use client";
import { PageShell } from "@/components/page-shell";
import { Code2, Palette, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

const values = [
  { icon: Zap, title: "Speed First", desc: "We optimize every pixel and request because your time matters." },
  { icon: Palette, title: "Beautiful by Default", desc: "We believe powerful tools should also be a joy to use." },
  { icon: Users, title: "Community Driven", desc: "Your feedback shapes our roadmap. No closed doors." },
  { icon: Code2, title: "Open at Heart", desc: "We build in public and believe in open standards." },
];

export default function AboutPage() {
  return (
    <PageShell title="About Komet" description="We're building the last social media management tool you'll ever need.">
      <div className="prose prose-invert max-w-none space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-on-dark)] mb-3">Our Story</h2>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed">
            Komet started with a simple frustration: managing social media across multiple platforms was too slow, too expensive, and too complicated. We asked: what if one tool could do everything — schedule, publish, analyze, and reply — without the bloat?
          </p>
          <p className="text-[var(--color-on-dark-soft)] leading-relaxed mt-3">
            Today, Komet connects to 15+ platforms and is trusted by creators, teams, and agencies worldwide. We&rsquo;re still a small team with a big vision: make social media management effortless.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-[var(--color-on-dark)] mb-6">What We Believe</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                    <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--color-on-dark)] text-sm sm:text-base">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-[var(--color-on-dark-soft)] leading-relaxed">{v.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
