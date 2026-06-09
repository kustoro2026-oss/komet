# i18n Full Audit & Fix — Komet

> Goal: Translate all hardcoded English text across 19 files into next-intl (en.json + id.json)

**Audit result:** 19 files found with hardcoded English. ~350+ strings need keys.
Both `en.json` and `id.json` are at ~307 lines each. After fix, they'll grow significantly.

## Files grouped by priority

### Batch 1 — High Impact (user-facing dashboard pages)
1. `team/page.tsx` — ~30 strings (heading, form labels, roles, errors, dialogs)
2. `notifications/page.tsx` — ~45 strings (stats, tabs, webhook config, dialogs)
3. `auto-reply/page.tsx` — ~35 strings (rules, form, dialogs)
4. `media/page.tsx` — ~35 strings (library, table, upload, empty states)
5. `onboarding/page.tsx` — ~25 strings (steps, help cards, CTA)

### Batch 2 — AI & Content
6. `ai/page.tsx` — ~40 strings (fields, options, templates)
7. `ai/templates/page.tsx` — ~15 strings
8. `ai/agent/page.tsx` — ~12 strings
9. `posts/drafts/page.tsx` — ~8 strings
10. `posts/bulk/page.tsx` — ~15 strings
11. `posts/[postId]/page.tsx` — ~40 strings (edit, preview, dialogs)

### Batch 3 — Account & Settings
12. `accounts/connect/page.tsx` — ~25 strings
13. `accounts/[accountId]/page.tsx` — ~20 strings
14. `settings/page.tsx` — ~40 strings (sidebar, notifications, security, etc.)

### Batch 4 — Marketing & Auth
15. `page.tsx` (landing) — ~30 strings (hero, features, CTA)
16. `mobile/page.tsx` — ~35 strings (features, guide, CTA)
17. Auth overrides — 5 placeholders + "Back to Home" (login, register, forgot-password)
18. `contact/page.tsx` — ~10 strings
19. `terms/page.tsx` — ~15 strings
20. `cookies/page.tsx` — ~10 strings
21. `changelog/page.tsx` — ~10 strings
22. `docs/api/page.tsx` — ~12 strings
23. `invite/[token]/page.tsx` — ~15 strings

### Batch 5 — Layout Components
24. `sidebar.tsx` — ~10 strings (logo, workspace dialog, user menu)
25. `top-nav.tsx` — ~8 strings (logo, user menu)
26. `notification-dropdown.tsx` — ~6 strings
27. `pwa-install-banner.tsx` — ~5 strings
28. `page-shell.tsx` — ~3 strings (navbar, copyright)
29. `onboarding-checklist.tsx` — ~12 strings (steps fallback)

## Approach

For each file:
1. Add `useTranslations()` import
2. Replace all hardcoded strings with `t("namespace.key")`
3. Add keys to `messages/en.json` (English) and `messages/id.json` (Indonesian)
4. Verify the file compiles (no TS errors)

New namespace conventions:
- `team.*` — team page
- `notificationsPage.*` — notifications page
- `autoReply.*` — auto-reply page
- `media.*` — media library
- `onboarding.*` — onboarding page
- `ai.*` — AI studio
- `aiTemplates.*` — AI templates
- `aiAgent.*` — AI agent
- `postDetail.*` — post detail/edit page
- `bulkUpload.*` — bulk upload
- `connectAccount.*` — connect account page
- `accountDetail.*` — account detail page
- `invite.*` — invitation page
- `components.*` — layout components (sidebar, top-nav, etc.)
- `marketing.*` / extend `landing.*` — marketing pages (contact, terms, cookies, changelog, docs)
- Existing namespaces that need extending: `settings.*`, `landing.*`, `auth.*`, `posts.*`, `accountsPage.*`, `common.*`

## Known pitfalls

- `next-intl` uses `useTranslations("namespace")` — namespace must match top-level key in JSON
- Some files already import `useTranslations` — add another call for a different namespace
- Placeholder text like "you@example.com" can stay as-is (they're examples, not real UI text), but should be consistent
- `title` attributes on icons need translations too
- Error messages from API calls should also be translated
- Loading states like "Loading..." should use `common.loading`
- "Cancel" buttons should use `common.cancel`
