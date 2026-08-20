# Paper theme — handoff

Last updated 20 Aug 2026. Read this first in a new chat, then `Paper/README.md`
(folder map + daily loop), `Paper/DECISIONS.md` (running log of every choice and
why), and `Paper/LAB-SPEC.md` (editor contract).

## What this project is

Reskinning Aman's Astro portfolio (`AmanBeni.github.io`) from a pixel-art theme
to a papercraft / letterpress theme, taking art direction from
https://drinkmeli.com/ . The new theme lives at the `/lab` route so the old
live site is never touched.

- Stack: Astro 7 + Tailwind v4 (`@tailwindcss/vite`), no UI framework.
- Old pixel site preserved: git tag `v1-pixel`, branch `pixel-theme` (pushed).
  `git checkout v1-pixel` restores it. The live site on `main` is still the
  pixel version; the paper theme has NOT been promoted to the homepage yet.
- All paper work is on branch **`paper-theme`** (not pushed). Working tree clean.

## Current state of the page (`/lab`)

Top to bottom:
- **Slim top strip** (empty, meli promo-band style), height = `--page-inset`.
- **Sticky top bar**: no wordmark (removed), italic-serif nav centred
  (about / work / beyond / cv), "get in touch" as a **paper button** (raised
  chip, lifts on hover, presses on click) on the right. One hairline under it.
- **Hero**: dark green `forest-laid-forest` paper panel, `min-height:460px`.
  Serif headline "Hi, I am Aman", sans subtitle split on two lines, two dotted
  CTAs (View selected work / Read my background), Aman's photo below the text
  (taped + shadowed). On the right, the `hero-support-original` diorama
  (taped + shadowed). Behind them: a golden-ratio **spiral** decor (right) and
  an **engineering grid** (litho) behind the photo, both screen-blended.
  A thin closing strip under the green.
- **Proof ticker**: slow marquee of Strategy · Operations · Data · AI systems ·
  Executive communication. Reduced-motion safe.
- **About / Education / Work / Skills / Beyond / Contact**: cream ground, one
  page background throughout, sections divided by single hairline rules only
  (no colour blocks). Contact bookends with the same green as the hero.
- **Page frame**: hairline rules inset on all four edges (PencilFrame), above
  the sticky bar in z-order.

## Design rules that are settled (do not re-litigate)

- **Brown ink** on all light-ground text (`--ink #4a3527`); hero/contact keep
  cream text on green. (Aman chose brown knowing it reads most like Meli.)
- **Two fonts only**: Sorts Mill Goudy (headings, and the italic nav) + one
  sans for everything else. Current sans = **Satoshi** (staying — Aman
  confirmed 20 Aug). No typewriter face anywhere (`--font-mono` aliases
  `--font-body`). To change the sans site-wide: first name in `--font-body` in
  `src/paper/tokens.css`. Options wired: Satoshi, Satoshi Static, Inter,
  Manrope, New York, SF Pro Display, SF Pro Text.
- **No tilted images** (tape may have a small angle; photos never).
- **Shadows**: photos carry a paper-lift shadow (light from top-left). No
  shadows elsewhere.
- **Headings**: sentence case, written correctly in the markup (no CSS
  lowercase hack).
- **Photos** go through `src/paper/components/PaperPhoto.astro`, which adds the
  shadow AND masking tape automatically. Small photo = 1 tape (top centre),
  large = 2 (top corners), centred 50/50 on the top edge. Any new photo that
  uses this component is taped/shadowed with no extra work.

## Key files

Code that Astro forces into `src/` (everything else is under `Paper/`):
- `src/pages/lab.astro` — assembles the page, top strip, nav, paper button.
- `src/paper/tokens.css` — all design tokens + font imports. The mood dial.
- `src/paper/local-fonts.css` — self-hosted @font-face (Satoshi, Apple, Euclid).
- `src/paper/sections/*.astro` — Hero, About, Education, Work, Skills, Beyond,
  Contact.
- `src/paper/components/` — PaperPhoto (shadow+tape), ProofTicker, PencilFrame,
  PaperCard, TapeStrip, GraphPaper, TornEdge, PaperObject.
- `src/paper/editor/*` + `plugins/lab-dev-server.mjs` — the Lab visual editor
  (dev-only, FROZEN, see below). Do not spend effort here.

Under `Paper/`:
- `References/` — Aman's original art (git-ignored, local only; back it up).
  `References/Lab Files/<category>/` is the drop zone. `References/Tape/` holds
  the 6 tape cutouts. `References/feedback/` holds annotated screenshots.
- `assets/` + `public/paper/` — web-ready copies (committed).
- `scripts/process-assets.mjs` — shrinks art; `convert-fonts.sh` — font woff2.
- `CHANGES.md` — the change queue (see workflow below).
- `font-options.html` — the 7-font comparison (keep for future font changes).
- `saved/lab-state.json` — where the Lab editor writes (currently unused).

## How to work with Aman (important)

- **The change queue.** Aman adds bullets to `Paper/CHANGES.md` under "Next
  round" and says "run the queue". Read the file, do all of it in one pass
  (delegate mechanical, self-contained parts to a Sonnet sub-agent; keep the
  taste/interconnected parts in the main chat), verify in the browser, move
  items to "Done" with the date. "Rules that always apply" at the top of that
  file are standing preferences — never repeat them in a bullet.
- **Spatial changes: ask for a marked-up screenshot**, don't build from prose.
  Aman drops annotated screenshots in `Paper/References/feedback/`. This is the
  single biggest friction-saver — a red box on a screenshot beats paragraphs.
- **Delegate to Sonnet** for chunky mechanical work (asset processing, pipeline
  edits) to save this chat's context. Split by file so tracks never collide.
- **Document automatically** in DECISIONS.md; don't wait to be asked.
- **Plain language, be to the point.** Aman is technical but not a SWE.
- **Figma is closed** to us (free Starter plan, MCP needs a paid seat). Don't
  suggest wiring it up. Aman exports frames as PNG for us to read as images.

## Verify + build

- Dev server: `mcp__Claude_Browser__preview_start` with the `astro-dev` config,
  NEVER Bash. If edits don't show, the dev server is serving stale CSS: kill it
  (`lsof -ti:4321 | xargs kill -9`) and restart. HMR is unreliable here.
- The Browser pane screenshot often returns a blank cream frame when scrolled
  down. Workaround: hide `#hero` and `.proof` via javascript_tool, scroll to 0,
  screenshot; or verify via `read_page` / computed styles.
- `npm run build` must pass (8 pages). The Lab editor is confirmed absent from
  production output.

## The Lab editor (frozen)

A dev-only drag/layer editor at `/lab` (press `E`). Aman found it not useful
and asked to stop building it (18 Aug). It still works for the Theme tab
(swap backgrounds/fonts) and its Layers panel. Do NOT invest more here unless
asked. Full detail: DECISIONS.md "Track B" entry + LAB-SPEC.md.

## Open / pending

- Paper theme is NOT yet promoted to the homepage (`index.astro` / `main`).
  When Aman is happy, that promotion + pushing `paper-theme` is a deliberate
  step to confirm with him.
- `References/` originals live only on Aman's Mac (git-ignored). Remind him to
  back up to iCloud/Drive.
- If an SF Pro font is ever chosen for the live site, subset it first (the
  full woff2 are 3.1MB each).
- The About backing grid still faintly grazes the body text on the left; pull
  it fully behind the photo if Aman flags it.
