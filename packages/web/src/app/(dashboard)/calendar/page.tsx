"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { useTranslations } from "next-intl";

interface CalendarPost {
  id: string;
  content: string;
  platforms: Platform[];
  date: number;
  time: string;
  status: "scheduled" | "draft" | "published";
}

const MOCK_POSTS: CalendarPost[] = [
  { id: "1", content: "New feature announcement!", platforms: ["twitter", "linkedin"], date: 5, time: "09:00", status: "scheduled" },
  { id: "2", content: "Behind the scenes photoshoot", platforms: ["instagram", "tiktok"], date: 5, time: "14:00", status: "scheduled" },
  { id: "3", content: "Weekly motivation thread", platforms: ["twitter"], date: 6, time: "10:00", status: "draft" },
  { id: "4", content: "Product update v2.4", platforms: ["twitter", "linkedin", "facebook"], date: 7, time: "11:00", status: "scheduled" },
  { id: "5", content: "Customer success story", platforms: ["linkedin"], date: 8, time: "15:00", status: "scheduled" },
  { id: "6", content: "Friday fun post", platforms: ["instagram", "twitter"], date: 8, time: "17:00", status: "draft" },
  { id: "7", content: "Industry trends webinar", platforms: ["linkedin", "facebook"], date: 10, time: "09:00", status: "scheduled" },
  { id: "8", content: "Team spotlight", platforms: ["instagram"], date: 12, time: "12:00", status: "draft" },
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 5, 5)); // June 2024
  const t = useTranslations("calendar");
  const tp = useTranslations("posts");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = 5; // Mock today

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const getPostsForDay = (day: number) => MOCK_POSTS.filter((p) => p.date === day);

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
        <a
          href="/posts/create"
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow"
        >
          <Plus className="h-4 w-4" />
          {t("newPost")}
        </a>
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
          <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
            {MONTH_NAMES[month]} {year}
          </h2>
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
              className="px-3 py-2 text-center text-caption-uppercase text-[var(--color-on-dark-muted)] border-r last:border-r-0 border-[var(--color-ink-muted)]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month start */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] border-r border-b border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/30" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const posts = getPostsForDay(day);
            const isToday = day === today;

            return (
              <div
                key={day}
                className={`min-h-[120px] border-r border-b border-[var(--color-ink-muted)] p-2 transition-colors hover:bg-[var(--color-surface-dark)] ${
                  isToday ? "bg-[var(--color-primary)]/5" : ""
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-caption font-medium ${
                    isToday
                      ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                      : "text-[var(--color-on-dark)]"
                  }`}
                >
                  {day}
                </span>

                <div className="mt-1.5 space-y-1">
                  {posts.slice(0, 2).map((post) => (
                    <div
                      key={post.id}
                      className={`rounded px-1.5 py-0.5 text-micro truncate cursor-pointer ${
                        post.status === "scheduled"
                          ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-light)]"
                          : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                      }`}
                      title={post.content}
                    >
                      {post.content.length > 20
                        ? post.content.substring(0, 20) + "..."
                        : post.content}
                    </div>
                  ))}
                  {posts.length > 2 && (
                    <span className="text-micro text-[var(--color-on-dark-muted)]">
                      +{posts.length - 2} {t("more")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
        <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)] mb-4">
          {t("todaySchedule")}
        </h2>
        <div className="space-y-3">
          {getPostsForDay(today).length > 0 ? (
            getPostsForDay(today).map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-4 rounded-lg border border-[var(--color-ink-muted)] p-3"
              >
                <div className="flex items-center gap-1.5 text-caption text-[var(--color-on-dark-muted)] shrink-0">
                  <Clock className="h-3.5 w-3.5" />
                  {post.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-1 text-body-sm text-[var(--color-on-dark)]">
                    {post.content}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {post.platforms.map((p) => (
                      <span
                        key={p}
                        className="rounded bg-[var(--color-surface-dark)] px-1.5 py-0.5 text-micro text-[var(--color-on-dark-muted)]"
                      >
                        {PLATFORM_LABELS[p]}
                      </span>
                    ))}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-micro font-medium ${
                    post.status === "scheduled"
                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]"
                      : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                  }`}
                >
                  {post.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-body-sm text-[var(--color-on-dark-muted)] text-center py-4">
              {t("noPostsToday")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
