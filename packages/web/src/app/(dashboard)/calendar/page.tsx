"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlatformIcon } from "@/components/ui/platform-icon";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CalendarDays,
  ListTodo,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { useTranslations } from "next-intl";
import { usePosts } from "@/lib/posts/hooks";
import { useWorkspaceStore } from "@/stores/workspace-store";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[var(--color-warning)]/10 text-[var(--color-warning)] border-l-[3px] border-[var(--color-warning)]",
  scheduled: "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] border-l-[3px] border-[var(--color-primary)]",
  publishing: "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)] border-l-[3px] border-[var(--color-primary)]",
  published: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-l-[3px] border-[var(--color-success)]",
  failed: "bg-[var(--color-error)]/10 text-[var(--color-error)] border-l-[3px] border-[var(--color-error)]",
  partial: "bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-l-[3px] border-[var(--color-accent)]",
};

function getStatusBadge(status: string) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-micro font-medium ${colors.split(" ").slice(0, 2).join(" ")}`}>
      {status}
    </span>
  );
}

interface CalendarPost {
  id: string;
  content: string;
  title?: string;
  platforms: string[];
  date: number; // day of month
  time: string;
  status: string;
  scheduledFor?: string;
}

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date>(new Date(2024, 0, 1));

  useEffect(() => {
    const d = new Date();
    setNow(d);
    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDay(d.getDate());
    setMounted(true);
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const t = useTranslations("calendar");
  const router = useRouter();

  const { data: postsData, isLoading } = usePosts({ limit: 100 });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const isCurrentMonth = month === currentMonth && year === currentYear;

  // Parse API posts into calendar posts
  const calendarPosts = useMemo<CalendarPost[]>(() => {
    const items = postsData?.posts || [];
    const activeWs = useWorkspaceStore.getState().activeWorkspace;
    const wsSlug = activeWs?.slug;
    const result: CalendarPost[] = [];

    for (const post of items) {
      // Filter by workspace if one is active
      if (wsSlug && wsSlug !== "my-workspace") {
        const postTags = post.tags || [];
        if (!postTags.some((t) => t === wsSlug)) continue;
      }
      // Parse scheduledFor date
      const dateStr = post.scheduledFor || post.createdAt;
      if (!dateStr) continue;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) continue;

      // Only include posts for currently viewed month/year
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;

      const hours = d.getHours().toString().padStart(2, "0");
      const mins = d.getMinutes().toString().padStart(2, "0");

      result.push({
        id: post.id,
        content: post.content,
        title: post.title,
        platforms: post.platforms,
        date: d.getDate(),
        time: `${hours}:${mins}`,
        status: post.status,
        scheduledFor: post.scheduledFor,
      });
    }

    return result;
  }, [postsData, month, year]);

  const getPostsForDay = (day: number) => calendarPosts.filter((p) => p.date === day);
  const selectedPosts = selectedDay ? getPostsForDay(selectedDay) : [];
  const totalScheduled = calendarPosts.filter((p) => p.status === "scheduled").length;
  const totalDrafts = calendarPosts.filter((p) => p.status === "draft").length;
  const totalPublished = calendarPosts.filter((p) => p.status === "published").length;
  const todayPosts = isCurrentMonth ? getPostsForDay(today) : [];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setShowMonthPicker(false);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setShowMonthPicker(false);
  };
  const goToToday = () => {
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
  };

  const months = Array.from({ length: 12 }, (_, i) => MONTH_NAMES[i]);
  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
              {t("title")}
            </h1>
            <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-32 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3.5 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            <CalendarDays className="h-4 w-4" />
            Today
          </button>
          <a
            href="/posts/create"
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow"
          >
            <Plus className="h-4 w-4" />
            {t("newPost")}
          </a>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
          <span className="text-caption text-[var(--color-on-dark-soft)]">
            {totalScheduled} Scheduled
          </span>
        </div>
        <div className="h-3 w-px bg-[var(--color-ink-muted)]" />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--color-warning)]" />
          <span className="text-caption text-[var(--color-on-dark-soft)]">
            {totalDrafts} Drafts
          </span>
        </div>
        <div className="h-3 w-px bg-[var(--color-ink-muted)]" />
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
          <span className="text-caption text-[var(--color-on-dark-soft)]">
            {totalPublished} Published
          </span>
        </div>
        <div className="ml-auto text-caption text-[var(--color-on-dark-muted)]">
          {calendarPosts.length} posts this month
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-5 py-4">
          <button
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-heading-md font-semibold text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
            >
              {MONTH_NAMES[month]} {year}
              <ChevronDown className={`h-4 w-4 text-[var(--color-on-dark-muted)] transition-transform ${showMonthPicker ? "rotate-180" : ""}`} />
            </button>

            {showMonthPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMonthPicker(false)} />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-20 w-72 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-3 shadow-xl">
                  <div className="flex gap-2 mb-3">
                    <select
                      value={year}
                      onChange={(e) => setCurrentDate(new Date(Number(e.target.value), month, 1))}
                      className="flex-1 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-2 py-1.5 text-body-sm text-[var(--color-on-dark)]"
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {months.map((name, i) => {
                      const isActive = i === month;
                      return (
                        <button
                          key={name}
                          onClick={() => {
                            setCurrentDate(new Date(year, i, 1));
                            setShowMonthPicker(false);
                          }}
                          className={`rounded-lg px-2 py-2 text-caption font-medium transition-colors ${
                            isActive
                              ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                              : "text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                          }`}
                        >
                          {name.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={nextMonth}
            className="rounded-lg p-1.5 text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-[var(--color-ink-muted)]">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="px-2 py-2.5 text-center text-caption-uppercase font-medium text-[var(--color-on-dark-muted)] border-r last:border-r-0 border-[var(--color-ink-muted)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month start */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[130px] border-r border-b border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/20" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const posts = getPostsForDay(day);
              const isToday = isCurrentMonth && day === today;
              const isSelected = day === selectedDay && isCurrentMonth;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[130px] border-r border-b border-[var(--color-ink-muted)] p-2 transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-inset ring-[var(--color-primary)] bg-[var(--color-primary)]/5"
                      : isToday
                      ? "bg-[var(--color-primary)]/5"
                      : "hover:bg-[var(--color-surface-dark)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-caption font-medium ${
                        isToday
                          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                          : "text-[var(--color-on-dark)]"
                      }`}
                    >
                      {day}
                    </span>
                    {posts.length > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-micro font-medium text-[var(--color-primary-light)]">
                        {posts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {posts.slice(0, 3).map((post) => (
                      <div
                        key={post.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/posts/${post.id}`);
                        }}
                        className="group/post flex items-center gap-1 rounded px-1.5 py-1 text-micro transition-all hover:bg-[var(--color-surface-dark-raised)]"
                      >
                        <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          post.status === "scheduled" ? "bg-[var(--color-primary)]" :
                          post.status === "draft" ? "bg-[var(--color-warning)]" :
                          post.status === "published" ? "bg-[var(--color-success)]" :
                          post.status === "failed" ? "bg-[var(--color-error)]" :
                          "bg-[var(--color-on-dark-muted)]"
                        }`} />
                        <span className="text-[var(--color-on-dark-muted)] tabular-nums shrink-0">
                          {post.time}
                        </span>
                        <span className="truncate text-[var(--color-on-dark-soft)] group-hover/post:text-[var(--color-on-dark)]">
                          {post.content}
                        </span>
                      </div>
                    ))}
                    {posts.length > 3 && (
                      <span className="block pl-1 text-micro text-[var(--color-on-dark-muted)]">
                        +{posts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              {isCurrentMonth ? "Today's Schedule" : `${MONTH_NAMES[month]} ${selectedDay || "—"}`}
            </h2>
            {todayPosts.length > 0 && (
              <span className="rounded-full bg-[var(--color-primary)]/20 px-2.5 py-0.5 text-caption font-medium text-[var(--color-primary-light)]">
                {todayPosts.length} posts
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--color-on-dark-muted)]" />
            </div>
          ) : todayPosts.length > 0 ? (
            <div className="space-y-3">
              {todayPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/posts/${post.id}`)}
                  className="group cursor-pointer rounded-lg border border-[var(--color-ink-muted)] p-3 transition-all hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-dark)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1.5 text-caption text-[var(--color-primary-light)] shrink-0 mt-0.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="tabular-nums font-medium">{post.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2 text-body-sm text-[var(--color-on-dark)] group-hover:text-[var(--color-primary-light)] transition-colors">
                        {post.content}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap gap-1">
                          {post.platforms.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-dark)] px-1.5 py-0.5 text-micro text-[var(--color-on-dark-soft)]"
                            >
                              <PlatformIcon platform={p as Platform} className="h-3 w-3" />
                              {PLATFORM_LABELS[p as Platform] || p}
                            </span>
                          ))}
                        </div>
                        {getStatusBadge(post.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ListTodo className="h-8 w-8 text-[var(--color-on-dark-muted)] mb-2" />
              <p className="text-body-sm text-[var(--color-on-dark-muted)]">
                {isCurrentMonth ? "No posts scheduled for today" : "No posts on this day"}
              </p>
              <a
                href="/posts/create"
                className="mt-3 text-caption font-medium text-[var(--color-primary-light)] hover:underline"
              >
                Schedule a post
              </a>
            </div>
          )}
        </div>

        {/* Selected Day Detail */}
        <div className="lg:col-span-3 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              {selectedDay
                ? `${MONTH_NAMES[month]} ${selectedDay}, ${year}`
                : "Select a day"}
            </h2>
            {selectedPosts.length > 0 && (
              <span className="text-caption text-[var(--color-on-dark-soft)]">
                {selectedPosts.length} {selectedPosts.length === 1 ? "post" : "posts"}
              </span>
            )}
          </div>

          {selectedPosts.length > 0 ? (
            <div className="space-y-3">
              {selectedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => router.push(`/posts/${post.id}`)}
                  className="group cursor-pointer rounded-lg border border-[var(--color-ink-muted)] p-4 transition-all hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-dark)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {post.title && (
                        <p className="text-body-sm font-medium text-[var(--color-on-dark)] mb-1">
                          {post.title}
                        </p>
                      )}
                      <p className="line-clamp-2 text-body-sm text-[var(--color-on-dark-soft)]">
                        {post.content}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 text-caption text-[var(--color-on-dark-muted)]">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="tabular-nums">{post.time}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {post.platforms.map((p) => (
                            <span
                              key={p}
                              className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-dark)] px-1.5 py-0.5 text-micro text-[var(--color-on-dark-soft)]"
                            >
                              <PlatformIcon platform={p as Platform} className="h-3 w-3" />
                              {PLATFORM_LABELS[p as Platform] || p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {getStatusBadge(post.status)}
                      <span className="text-micro text-[var(--color-on-dark-muted)]">
                        {post.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <CalendarDays className="h-10 w-10 text-[var(--color-on-dark-muted)] mb-3" />
              <p className="text-body-sm text-[var(--color-on-dark-muted)]">
                {selectedDay
                  ? `No posts on ${MONTH_NAMES[month]} ${selectedDay}`
                  : "Click on a day to see posts"}
              </p>
              {selectedDay && (
                <a
                  href="/posts/create"
                  className="mt-3 text-caption font-medium text-[var(--color-primary-light)] hover:underline"
                >
                  Schedule a post
                </a>
              )}
            </div>
          )}

          {/* Error state */}
          {!isLoading && !postsData && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-[var(--color-error)] mb-2" />
              <p className="text-body-sm text-[var(--color-error)]">
                Failed to load posts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
