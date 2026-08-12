@AGENTS.md

# Frontend UI/UX guidelines

This is "Brasa," a Next.js site for an Argentine steakhouse with an established "ember & charcoal" brand identity. Work on it as a senior frontend/UI-UX engineer: reuse the design system already in place, load the relevant skill before touching visual or motion code, and treat brand/taste calls as decisions to raise with the user rather than make silently.

## Installed plugins

All 8 currently-enabled plugins are accounted for below (`claude plugin list` is the source of truth if this drifts):

- `frontend-design@claude-plugins-official`
- `core-3d-animation@claude-design-skillstack` (skills: `babylonjs-engine`, `gsap-scrolltrigger`, `motion-framer`, `react-three-fiber`, `threejs-webgl`)
- `frontend@jezweb-skills`, `web-design@jezweb-skills`, `design-assets@jezweb-skills`, `dev-tools@jezweb-skills` — only their UI/UX-relevant skills are documented below. `dev-tools` also bundles non-design skills (`git-workflow`, `github-release`, `vitest`, `project-docs`, `project-health`, `roadmap`, `team-update`, `codex-review`, `app-docs`, `deep-research`, `fork-discipline`) — not covered here, load them by name directly if needed.
- `vercel@claude-plugins-official` — a large skill set (AI SDK, chat-sdk, sandboxes, firewall, marketplace, etc.) mostly out of scope for this project; only the Next.js/Vercel-platform-relevant subset is documented below.
- `superpowers@claude-plugins-official` — general engineering workflow (not frontend-specific), documented in its own section since it applies to how any change on this repo gets made, not just UI/UX work.

## Skills to load, and when

### Design direction & review

- **frontend-design** — load before any new UI surface, section, or visual restyle (new pages, hero/landing changes, layout redesigns). It governs distinctive, brief-grounded choices over templated defaults: pin the subject, work brainstorm → plan → self-critique → build, spend the one "signature risk" deliberately, and cut whatever doesn't serve the brief. Do not skip the self-critique pass just because a component compiles and looks fine. This is the generative half.
- **design-review** (`frontend`) — the critique half: load after implementing a visual change to check layout, typography, spacing, colour, hierarchy, consistency, and responsive behaviour with a "does this look professional and polished" lens (not a usability check — see `ux-audit` for that). Produces a findings report with screenshots; use it as the visual-QA step before calling a redesign done.
- **design-system** (`frontend`) — extracts a design system from an existing site or screenshot into a `DESIGN.md`. Use for competitive research (studying a reference restaurant/hospitality site before a redesign) or to formalize this project's own "ember & charcoal" system into a doc if one is ever needed — not something to run against this codebase casually, since the tokens already live in `app/globals.css`/`lib/motion.ts`.

### Motion & 3D

- **motion-framer** — this project's animation library is `motion` (Framer Motion's successor). Load it for any new micro-interaction, gesture, hover/press state, or page-transition work. Reuse the shared tokens in `lib/motion.ts` (`EASE`, `EASE_CSS`, `DURATION`, `STAGGER`, `SPRING`, `SPRING_CSS`) and the `--ease-brand` CSS custom property in `app/globals.css` instead of introducing ad hoc easing/duration values.
- **gsap-scrolltrigger** — reach for this only if a scroll-driven sequence genuinely needs pinning/scrubbing beyond what the existing lightweight scroll-frame pattern (`subscribeScrollFrame`, see `components/features/hero.tsx`) can do. Try the existing pattern first; GSAP is a materially bigger dependency.
- **threejs-webgl / react-three-fiber / babylonjs-engine** — not currently used anywhere in this codebase (no 3D packages installed, no `<canvas>`-based scenes). Only load one of these if a feature genuinely calls for real 3D (e.g. an interactive dish/plate configurator); default to the existing 2D DOM+`motion` system for everything else rather than introducing a 3D engine for decorative effect.

### React & shadcn/Tailwind implementation

- **react-patterns** (`frontend`) — React 19 performance/composition rules (re-render prevention, composition over boolean props, server/client boundaries). Written against a Vite+Cloudflare baseline but the rules themselves are framework-agnostic for React 19 — use it as a review pass over `components/**/*.tsx`, not a scaffolding tool.
- **shadcn-ui** (`frontend`) — this project already uses shadcn/ui (`components/ui/*`, `components.json`, `style: base-nova`). Load when adding a new shadcn component, not when touching the existing customized ones (`button.tsx`/`input.tsx` already carry project-specific motion — see the design system notes below).
- **tailwind-theme-builder** (`frontend`) — matches this project's actual stack (Tailwind v4, CSS-first `@theme inline`, dark mode via `next-themes`). Useful for troubleshooting theme/colour-variable issues, not for redoing the token setup that already exists in `app/globals.css`.
- **landing-page / product-showcase / design-loop** (`frontend`) — generate whole new pages/sites from a brief or build multi-page sites autonomously. Situational: relevant only if a genuinely new standalone page (e.g. a promo/event page) is requested; not for editing the existing site. `react-native` (also in this plugin) does not apply — this is a web-only Next.js project.

### Assets

- **color-palette** (`design-assets`) — generates an accessible 11-shade scale + WCAG contrast checks from a brand hex. Use this the next time the `--destructive` brand-match question (currently left as generic red, flagged in the design-polish plan) needs revisiting, instead of hand-picking an oklch value.
- **image-processing** (`design-assets`) — resize/convert/optimise/crop, OG image generation. Directly applicable to `public/images/*.jpg` and the OG cover asset; check `scripts/gen-assets.mjs` first since this project already has a custom asset-generation script.
- **favicon-gen** (`design-assets`) — regenerate `public/icon.svg`, `apple-touch-icon.png`, `icon-192/512.png`, manifest icons if the mark ever changes. `app/manifest.ts` is the existing wiring to update alongside any regenerated icon set.
- **icon-set-generator** (`design-assets`) — bespoke, cohesive SVG icon sets. Only reach for this if the ember brand ever wants custom iconography instead of `lucide-react` (the current icon source throughout `components/**`); don't mix a generated set with lucide within the same UI without a deliberate reason.
- **ai-image-generator** (`design-assets`) — generates images via Gemini/GPT APIs (needs API keys). Situational — for new hero/dish photography placeholders or marketing assets; this is a heavier, external-API-dependent skill, not a default reach.

### SEO & structured data

- **seo-local-business** (`web-design`) — JSON-LD `LocalBusiness` schema, meta tags, robots.txt, sitemap.xml, tuned for Australian phone/ABN patterns by default. This project already has hand-built equivalents (`Restaurant` JSON-LD in `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`) for an Argentine business — use this skill only to audit/extend the existing schema, and adapt any AU-specific formatting (phone, business-number patterns) to AR conventions rather than applying it as-is.

### UX verification

- **ux-audit** (`dev-tools`) — live walkthrough of the running app with hard gates (0 console errors, 0 a11y Critical/Serious, perf budget, real interaction proof). Use for the reservation flow (form → WhatsApp deep link) and other interactive paths before calling a feature done — stronger than a manual click-through.
- **responsiveness-check** (`dev-tools`) — automated breakpoint sweep with screenshots and layout-transition detection. Use this instead of manually resizing/screenshotting for the mobile/tablet/desktop verification step below.
- **ux-extract / ux-compare** (`dev-tools`) — extract a UX pattern library from a reference app, then compare multiple libraries. Useful for competitive research on other restaurant/hospitality sites before a redesign decision; not needed for routine changes.
- **onboarding-ux** (`dev-tools`) — audits/builds empty states, tooltips, first-run guidance. Marginal fit for a marketing site with no logged-in app state, but relevant if empty/error states in the reservation form or gallery ever need a deliberate pass.

### Next.js / Vercel platform (`vercel` plugin)

This project actually runs the stack these skills target — Next.js 16 App Router on Turbopack, deployed via Vercel — so this is the highest-signal subset of the `vercel` plugin, not a generic add-on:

- **nextjs** — App Router, Server Components/Actions, Cache Components, layouts, middleware, data fetching, rendering strategy guidance. Load for any non-trivial routing/data-fetching change; remember `AGENTS.md` already flags that this Next.js build has breaking changes from training-data assumptions — check `node_modules/next/dist/docs/` first as that file instructs.
- **react-best-practices** — auto-triggers after editing multiple `.tsx` files; a condensed hooks/structure/a11y/perf checklist. Functionally overlaps with `react-patterns` (`frontend`, documented above) — either covers this codebase; no need to run both on the same change.
- **shadcn** — CLI/component/theming guidance for shadcn/ui, same territory as `shadcn-ui` (`frontend`) above. Two plugins cover the same ground here; reach for whichever surfaces first, they're not contradictory.
- **turbopack** — bundler-specific debugging (HMR issues, build errors, Turbopack-vs-Webpack differences). This project's dev server already runs on Turbopack by default (`next dev`) — load this if a build/HMR issue looks bundler-specific rather than code-specific.
- **next-cache-components** — Cache Components/PPR/`use cache`/`cacheLife`/`cacheTag` guidance for Next.js 16. Relevant if this mostly-static marketing site ever adds a dynamic/personalized data path that needs partial prerendering.
- **cdn-caching** — debugging Vercel's CDN cache behaviour (hit rate, stale content, revalidation) post-deploy. Situational — only once the site is actually deployed and a caching issue shows up.
- **deployments-cicd** — deploying, promoting, rolling back, CI workflow config. Reach for this once there's an actual deploy/CI question, not for local dev work.
- **routing-middleware / next-upgrade** — request-interception-before-cache and Next.js version-upgrade guidance respectively. Both situational; not relevant to routine UI work.
- The `vercel` plugin also adds three agents usable via the Agent tool: `vercel:ai-architect`, `vercel:deployment-expert`, `vercel:performance-optimizer`. This project has no AI features, so `ai-architect` doesn't apply; `deployment-expert` and `performance-optimizer` are relevant once deploy/perf work is actually in scope.

## General engineering workflow (`superpowers` plugin)

Not frontend-specific, but installed and enabled — applies to how work on this repo gets done regardless of layer:

- **brainstorming** — required before creative/feature work: explore intent and design before implementation. Overlaps in spirit with `frontend-design`'s brainstorm step for visual work; for non-visual features, this is the equivalent gate.
- **writing-plans / executing-plans** — write a plan for any multi-step task before touching code, then execute it with review checkpoints. Consistent with this project's existing plan-first pattern for design-polish passes.
- **test-driven-development** — write tests before implementation code. This project currently has no test suite configured (no `vitest`/`jest` setup) — if that changes, this skill governs the workflow; `dev-tools`' `vitest` skill (not documented above, out of UI/UX scope) would set the infrastructure up first.
- **systematic-debugging** — structured approach before proposing fixes for any bug/test failure/unexpected behaviour.
- **subagent-driven-development / dispatching-parallel-agents** — for executing independent parts of a plan via subagents, when a task has 2+ genuinely independent pieces.
- **using-git-worktrees** — isolate feature work from the current workspace before executing a plan.
- **requesting-code-review / receiving-code-review** — verify work meets requirements before considering it done; when review feedback arrives, verify it technically rather than applying it blindly.
- **verification-before-completion** — run and confirm verification commands before claiming anything is fixed/complete/passing. This project's established pattern already does this (`tsc --noEmit`, `eslint`, and an actual browser check after every change) — this skill formalizes that habit.
- **finishing-a-development-branch** — decide how to integrate completed work once tests pass.
- **writing-skills / using-superpowers** — meta-skills for authoring new skills or discovering which skill applies; not relevant to day-to-day work on this site.

## Design system already in place — reuse, don't reinvent

- **Brand tokens**: the "ember & charcoal" palette lives in `app/globals.css` (`--ink`, `--smoke`, `--bone`, `--ember`, `--ember-hot`, `--gold`, `--wine`, `--on-media*`), with a light "warm parchment" theme and dark "native charcoal" theme (dark is default). Don't fall back to generic shadcn slate/zinc tokens or a stock destructive red without checking whether a brand-matched token already exists or should be added.
- **Typography**: Fraunces (display serif) + Work Sans (body) + IBM Plex Mono (mono/labels/eyebrows), wired in `app/layout.tsx` as `--font-display` / `--font-body` / `--font-mono`.
- **Motion tokens**: `lib/motion.ts` is the single source of truth for easing/duration/stagger/spring — see above. Mirror any new pure-CSS easing need through `--ease-brand` in `app/globals.css` rather than hardcoding another `cubic-bezier(...)` string.
- **Reduced motion**: global `MotionConfig reducedMotion="user"` (`components/motion/motion-provider.tsx`) plus a `@media (prefers-reduced-motion: reduce)` block in `app/globals.css` that forces near-zero animation/transition durations. `hooks/use-reduced-motion.ts` is the JS-side hook (`useSyncExternalStore` on `matchMedia`, no hydration mismatch) — any new animated component must respect it, matching the pattern already used in `hooks/use-tilt.ts` / `hooks/use-magnetic.ts`.

## Working process for UI/UX changes

1. Read the relevant existing component before touching it. Most of this codebase already avoids generic template defaults (custom palette, custom easing, spring-based magnetic/cursor interactions, SSR-safe word-by-word hero reveal, 3D-tilt dish cards) — match that bar rather than reverting to shadcn/Tailwind defaults.
2. For anything visual or aesthetic, load `frontend-design` and work through its process before writing code — don't jump straight to implementation on a design decision.
3. For anything animated, load `motion-framer` (or `gsap-scrolltrigger` for genuine scroll-pinning needs) and build on `lib/motion.ts`'s shared tokens.
4. For React implementation quality on non-trivial component work, a `react-patterns` pass and a `shadcn-ui`/`tailwind-theme-builder` check (when touching those layers) are worth running before calling it done.
5. Treat brand-voice/taste calls (copy tone, whether an element reads as "templated," palette shifts) as questions for the user, not silent defaults — this project has an established point of view worth protecting.
6. Verify with `design-review` (visual polish) and `responsiveness-check` (mobile/tablet/desktop breakpoints) in place of manual screenshotting where practical, in both light and dark themes and with `prefers-reduced-motion` toggled on. For interactive flows (e.g. the reservation form), run `ux-audit` before calling the feature done. Reduced-motion coverage here is a maintained standard, not optional polish.
