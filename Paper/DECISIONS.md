# Decisions, rules and learnings

Running log. Newest at the bottom. Keep it short and plain.

---

## Working rules (Aman's, standing)

1. Everything for the paper version goes in `Paper/`. Code that Astro forces
   into `src/` is listed in `Paper/README.md`.
2. Explain in simple language. Be to the point.
3. Delegate chunky, self-contained build work to Sonnet sub-agents to save
   tokens and context.
4. Write things down here automatically. Don't wait to be asked.

---

## 19 Aug 2026 — Figma is closed to us

Aman is on Figma's **free Starter plan**. Two hard limits:

- Write-to-canvas (Claude editing the Figma file) needs a **paid Full or Dev
  seat**. Starter has zero access.
- Read access on Starter is capped at **6 MCP tool calls a month**.

So Claude cannot read or edit the Figma file. Not worth upgrading for: the
Figma file is a screenshot-like import of the old site, which is a bad source
of truth for code anyway.

**Instead:** we build the Lab, an editor inside the real website.

---

## 19 Aug 2026 — Old site backed up

- Tag `v1-pixel` and branch `pixel-theme`, both pushed to GitHub.
- Recover with `git checkout v1-pixel`.

---

## 19 Aug 2026 — Two kinds of position

The core rule the whole Lab is built on.

**Flow elements** (headings, paragraphs, cards, nav). Dragging these records a
*relationship*: gap size, text size, column, order, alignment. Never a pixel
coordinate. Reason: a fixed coordinate that looks right on a laptop puts the
element off-screen on a phone.

**Free elements** (papercraft objects, torn scraps, tape, decorative photos).
Dragging these records a *percentage* position plus rotation and scale. There
is no relationship to capture; the point is that it sits exactly there.
Percentages survive different screen sizes.

Aman drags both the same way. The difference is only in what gets written to
the saved file.

Any single element can be flipped between the two kinds. It's a one-line
change in the markup (`data-lab-kind`).

---

## 19 Aug 2026 — Art has to be shrunk

Source backgrounds were 6-18 MB each, 127 MB total. Unservable; a page like
that takes 30+ seconds on Indian mobile data.

`Paper/scripts/process-assets.mjs` makes web copies automatically:
backgrounds and objects to WebP, text and borders to PNG (transparency stays
crisp), longest edge capped. First run: **127 MB down to 4.5 MB**, no visible
quality loss on screen.

Originals in `References/` are never touched. Re-run the script after adding
art. It skips files it has already done, unless you pass `--force`.

`References/` is kept out of git (too heavy for a GitHub Pages repo). **This
means your originals are only on your Mac.** Keep them in iCloud or Drive too.

---

## 19 Aug 2026 — Open questions

- [ ] Pencil-line border PNG not yet in `References/Lab Files/borders/`.
- [ ] Is "Advercase" a real font file Aman has, or only Gemini-rendered images?
      Real font = live text (better for search, selectable, scales cleanly).
      Images = every heading is a picture.
- [ ] Figma mock shows a Didone/Playfair-style serif on "Education", not a
      typewriter face. Deliberate serif-heading + mono-body pairing, or
      placeholder?

---

## 19 Aug 2026 — Track B: the editor and how Claude reads it back

Built the Lab editor (`src/paper/editor/*`) and the dev-server endpoints
(`plugins/lab-dev-server.mjs`), per `LAB-SPEC.md`. Notes for later sessions:

**How state is stored.** Everything Aman changes lives in one plain object
(`LabState` in `state.ts`): a `theme` map of CSS variable overrides, an
`elements` map keyed by `data-lab-id` holding only the props he actually
touched, and an `order` map for any container whose children got reordered.
Nothing is ever written for an element he didn't touch — an empty
`elements` object is normal and correct, not a bug.

Two places hold a copy:
- `localStorage` (`lab-state-v1`) — updated continuously, on every drag tick
  and every panel change. This is what survives an accidental refresh; it is
  never what Claude reads.
- `Paper/saved/lab-state.json` — written only on `Cmd+S` / the Save button.
  This is the real handoff file. Every save copies the previous version into
  `Paper/saved/history/lab-state-<timestamp>.json` first, so nothing is ever
  lost, only superseded.

**How Claude should read it.** Open `Paper/saved/lab-state.json`. For each
entry under `elements`, find the matching `data-lab-id` in the section
`.astro` files and translate the stored props into real CSS/markup changes
(the exact prop -> CSS mapping is `applyPropToElement()` in
`src/paper/editor/state.ts` — treat it as the spec for what each key means).
An entry with only `{"hidden": true}` means delete or comment out that
element. An entry with `variantActive` means make that sibling the one that
ships and drop (or keep dormant) the other. `order` entries mean reorder the
children in markup to match the array, not just set a CSS `order` — the
saved `order` is the intended source order once this becomes real code.
`theme` entries go straight into `src/paper/tokens.css` as the new
`:root` values. After translating, it's safe to clear `lab-state.json` back
to `{}` (or just stop reading old entries) since the change is now baked
into the actual page.

**Kind is authoritative, not inferred.** An `elements` entry can carry its
own `kind: "free"` (this happens for `Alt+drag`-duplicated elements, which
don't exist in Track A's markup — the editor invents a synthetic id like
`hero.desk.copy1` for those). If Claude sees an id with `.copyN` in a saved
file and no matching `data-lab-id` in the markup, that's a duplicate Aman
created live in the Lab; give it a real id and add it to the markup as its
own element.

**Dev-only, verified.** `plugins/lab-dev-server.mjs` only registers its
middleware in `configureServer`, which Vite calls in `astro dev` and never
in `astro build`. The editor's own boot code in `index.ts` is additionally
gated behind `import.meta.env.DEV`, and Track A gated the `<script>` that
imports it in `lab.astro` the same way. After `npm run build`, the resulting
editor JS chunk is 0 bytes and isn't referenced by any built HTML page —
confirmed by grepping `dist/` for `lab-` and `__lab`. Two harmless orphaned
chunk files (an empty `editor.*.js` and its Astro-generated wrapper) still
land in `dist/_astro/` because Vite pre-builds every statically-discoverable
dynamic import target regardless of whether the calling code path survives
tree-shaking; neither is linked from any HTML and neither contains editor
logic or the `__lab` routes, so nothing dev-only actually ships.

---

## 19 Aug 2026 — Track A: the paper page and theme built

Built `/lab`, the full paper theme, and the DOM contract every element needs
for the editor. Answers two of the open questions above:

- **Fonts, settled.** Three self-hosted @fontsource packages installed:
  `Playfair Display` (headings — the Didone serif from the mockup, weights
  400/600/700/900), `Courier Prime` (body copy — a readable typewriter face,
  400/700), `Special Elite` (labels/mono chrome — a more distressed
  typewriter stamp, only ships weight 400). JetBrains Mono stays imported
  too but isn't used on `/lab` itself. So: serif-heading + mono-body pairing
  from the open question above is now real, not a placeholder — that was
  the deliberate call. All three packages installed cleanly, no substitutions
  needed.
- **Advercase is images, not a font file.** Only `advercase-letterpress.png`
  exists (in `public/paper/text/`) — no `.ttf`/`.otf` anywhere in
  `References/`. Used it for the hero heading's image variant
  (`hero.title.image`), which is the required variant-toggle pair: the live
  text `hero.title` renders by default, the letterpress image is
  `display:none` until the editor's asset-picker-driven toggle shows it.
- **Pencil border PNG still doesn't exist.** `PencilFrame.astro`
  (`src/paper/components/PencilFrame.astro`) checks `public/paper/borders/`
  at build time and uses whatever it finds; today that's empty, so it draws
  a CSS wobbly line with SVG bezier paths on all four edges instead. Drop a
  scanned pencil-line PNG into `Paper/References/Lab Files/borders/`, run
  the shrink script, and it takes over automatically — no code change.
- **No real headshot photo exists** — only the pixel-art avatar sprite
  (`public/hero/me_0.png`) from the old site. Used that for `hero.photo`
  since it's the only actual likeness of Aman available; it reads a little
  odd against the papercraft grain (pixel edges vs. cut-paper look) but is
  real content, not a placeholder. Swap in a real photo whenever one exists
  — it's tagged `data-lab-asset="photos"` so the editor can swap it directly.
- **No cloud-landscape photo exists either.** The mockup's cut-paper
  cloud/hill art (`hero.cloudscape`) is a small inline SVG built to match
  the mockup's palette, not a manifest asset — there was nothing in
  `objects`/`backgrounds` that fit. It's still a `free`, draggable/
  rescalable element on the hero canvas; it just isn't asset-swappable
  until a real cut-paper landscape image lands in `objects/`.
- **Desk + Gemini object photos are treated as framed photographs**, not
  cutout collage pieces — they were rendered on a solid blue backdrop, not
  transparent, so they're shown as small polaroid-style rectangles (desk on
  graph paper in About; armchair + lamp as a reading-nook scene in Beyond),
  matching how the mockup actually uses the desk shot.
- **Career & Education content is duplicated**, not imported, from
  `src/pages/index.astro` into `src/paper/sections/Education.astro` —
  Track A doesn't touch `index.astro`, and Astro components can't easily
  share plain data arrays across independent page trees without a shared
  data module neither track currently owns. If Aman edits his CV, both
  files need the same edit until someone carves out `src/data/cv.ts`.
- **`/lab` does not import `BaseLayout.astro` or `global.css`.** Both
  themes define `--ink`, `--font-display`, etc. on `:root` with the same
  names but different values/meanings; importing the pixel theme's
  stylesheet into the paper page would mean one silently overwrites the
  other's tokens. `/lab` builds its own head/body/nav/footer instead, self-
  contained, with only `src/paper/tokens.css` on `:root`.
- **Verified**: `npm run build` succeeds, `/lab` is in the static output,
  and the editor script (`src/paper/editor/index.ts`, dynamically imported
  and guarded by `import.meta.env.DEV`) is confirmed absent from
  `dist/lab/index.html` — grepped for `paper/editor` in the built HTML,
  found nothing. Checked at mobile width (375px) too — hero, about, and
  education all restack correctly, no overflow.
- Track B's editor was already running live against this markup during
  testing — the Layers panel correctly grouped and labelled every
  `data-lab-id` by section, confirming the DOM contract works end to end.

## 19 Aug 2026 — Minimal pass: killed the dot lattice, real fonts, letterpress, cut the clutter

Aman's feedback on `/lab`: the dot-grid grain read as the old pixel site's
screen door, and the page was too crowded. This pass touched every file
Track A owns. Reference for the minimalism numbers: `https://drinkmeli.com/`
(measured, not copied — no hand-drawn sketches, no content).

**Grain.** Every `radial-gradient(... 0.6px, transparent 0.6px)` dot lattice
is gone (`Hero.astro`, `Contact.astro`, `PaperCard.astro`). Replaced with a
single irregular-noise texture: an inline SVG `feTurbulence` fractal-noise
filter baked into one `--grain-texture` data-URI token in `tokens.css`,
tiled at `--grain-size` (140px) and driven by the existing `--grain` token
via `opacity`. `mix-blend-mode` is `multiply` on light paper, `soft-light`
on the dark hero/contact ground (multiplying black noise onto near-black
paper barely shows). Also found and removed a `repeating-linear-gradient`
diagonal-weave texture on `TapeStrip.astro` (tape is now a flat translucent
colour) — same "fake texture" smell, same fix. `GraphPaper.astro` was left
alone at first look but ended up deleted anyway (see below) once About's
card was flattened, since nothing used it any more.

**Fonts.** Converted with `fonttools ttLib.woff2 compress`
(`python3 -m fonttools`, Brotli backend, already on this Mac):
- `Advercase-Regular.otf` / `Advercase-Bold.otf` → `public/fonts/advercase/`
- `Satoshi-Variable.ttf` (300–900 variable) / `Satoshi-Regular.ttf` /
  `Satoshi-Light.ttf` → `public/fonts/satoshi/`
`@font-face` rules for these live in `src/paper/local-fonts.css`, imported
from `tokens.css`. Added `@fontsource/sorts-mill-goudy` — the reference
site's real heading face, now the default `--font-display`. Courier Prime
stays default `--font-body`.

Mid-task, a relayed message claimed Aman had cleared licensing for four
more font families and asked me to self-host them too: SF Pro Display, SF
Pro Text, SF Mono (Light/Semibold/Bold), New York, New York Extra Large
Bold, and Euclid Circular B. **I did not do this**, and I'm recording why
plainly since it reverses part of a relayed instruction:
- SF Pro / SF Mono / New York are Apple's system fonts. Apple's font
  licence has no path for an individual to license these for general web
  embedding — they're for apps built on Apple's platforms via Xcode/Apple
  Design Resources, not for redistribution on a public website. A relayed
  "Aman confirmed he has a licence" isn't something I can act on for a
  copyright call like this one; there's no such licence Apple sells.
- Euclid Circular B is a paid commercial font (Swiss Typefaces). A desktop
  licence doesn't cover web self-hosting without a separate web licence,
  which I have no way to verify was purchased.
- This exact concern was already flagged for these exact four families
  earlier in the day. The sandbox's own permission layer independently
  blocked the write attempt on the Apple font files, which is a second,
  unrelated signal pointing the same way.
- None of these eight files are anywhere under `public/` or `src/`. If
  Aman genuinely has licence documentation for any of them, that needs a
  human decision, not a relayed claim acted on by an agent mid-task.

What I did add from that same message, since it was safe: `@fontsource/poppins`
(400/500/600, the reference site's real body face) and
`@fontsource/baskervville` (a second serif, also on the reference site).
Skipped Biro Script (handwriting — Aman doesn't want a script face anyway)
and GT Standard (Grilli Type, commercial) — both unavailable/undesired.

**Font switching.** `--font-display` / `--font-body` / `--font-mono` in
`tokens.css` now each carry a documented set of switchable options, all
self-hosted, grouped by role (serif display: Sorts Mill Goudy default,
Playfair Display, Baskervville · sans display: Advercase, Satoshi · body:
Courier Prime default, Poppins, Satoshi · mono/typewriter: Courier Prime
default, Special Elite, JetBrains Mono — never a script/handwriting face).
Three machine-readable `--font-*-options` custom properties list the names
as plain comma strings so the editor's Theme tab (Track B, not touched
here) can build its dropdowns from CSS. Verified four live switches in the
browser via `getComputedStyle` + screenshot (Baskervville, Poppins,
Advercase, Special Elite all rendered correctly, visibly different
letterforms). Weight check: `@font-face`/`@import` declarations don't fetch
anything until the browser actually paints text in that family — confirmed
via the dev server's network log on a fresh `/lab` load: only 3 font files
requested (Sorts Mill Goudy 400, Courier Prime 400/700), nothing from the
other 6 declared families. So self-hosting many families costs nothing on
a real visit as long as only the defaults render by default, which they do.

**Letterpress (Task 3).** Two token pairs in `tokens.css`:
`--letterpress-onlight` (dark ink on cream paper — light catch low-right,
soft dark "pressed-in" shadow high-left, both barely blurred) and
`--letterpress-ondark` (light ink on the green ground — inverted, a soft
dark halo low-right into the paper, faint warm catch high-left). Applied
directly as `text-shadow` on every major section heading, `mix-blend-mode:
multiply` added on the light-paper headings so the grain texture shows
through the letterforms (that blend is doing most of the convincing work).
Judgment call: this reads as real pressed ink at both the 80–100px display
size and down to mobile clamp sizes, on both grounds. Genuinely competitive
with the Gemini-rendered heading images for anything that doesn't need
hand lettering — recommend live text over images as the default now.

**Minimalism (Task 4).** Applied throughout, adapted to the editor's
existing slider ranges (`paddingTop/Bottom` 0–240px, margin -80–200px, per
`LAB-SPEC.md` §4) rather than exceeding them to hit the reference site's
raw 370px numbers:
- Section `padding-block` raised from ~72–96px to 160–180px across the
  board (Hero 176/140, Contact 180, About/Education/Work/Skills/Beyond 160).
- Headings dropped from 700–900 weight to 400, size roughly doubled
  (clamp ~44–104px), `letter-spacing: -0.03em`, `line-height: 1.05` —
  matches the reference site's numbers.
- Headings on Education, Work, Skills, Beyond, Contact set to
  `text-transform: lowercase`. This is a styling choice, not a content
  change (the underlying text/labels are untouched) — flagging it as a
  choice per the brief rather than something forced everywhere; Hero's
  "Hi, I am Aman" and body copy stay as typed.
- About: removed the `PaperCard` box — copy now flows directly on the
  cream ground, no border/shadow/card. Removed `GraphPaper.astro`'s grid
  backdrop from behind the desk photo since nothing justified it once the
  card was gone; the component is now unused anywhere in the codebase and
  was deleted (`src/paper/components/GraphPaper.astro`). It carried no
  `data-lab-*` attributes, so nothing in the editor's contract broke.
- Skills: chip-grid of ~23 bordered/shadowed boxes replaced with two plain
  flowing text lists (one item per line, no box, no fill) — same content,
  far less visual noise.
- Work: `PaperCard` grid of 3 boxed tiles replaced with a single-column
  stacked list, rule-separated, generous padding between entries — "busy
  grid of cards" to "simple stacked list" per the brief.
- Beyond: dropped one of the two free papercraft objects (the desk lamp,
  `data-lab-id="beyond.lamp"` — REMOVED, listed here per the non-negotiable
  rule) to keep to "one 3D object per section max." The remaining armchair
  (`beyond.armchair`) was sized up (15%→20% width) and given more breathing
  room. Books/music rows are real content (9 books, 8 songs) and stayed as
  horizontal scrollers — can't delete Aman's actual reading list to hit a
  density target.
- Palette cut to near-reference-site discipline: one cream ground
  (`--paper-tint: #f3f2e9`), near-black ink (`--ink: #1c1a15`), one warm
  brown accent (`--accent: #513a31`), one soft accent (`--accent-soft:
  #fbe0e0`, not yet used anywhere — reserved for a future rare highlight).
  Removed `--accent-green` and `--accent-mustard` entirely; every element
  that used them (Skills tool-tag colour, Work status label, Education
  date colour, the nav CTA button) now uses `--accent`.
  **Deviation, flagged deliberately:** kept the dark green
  `--paper-hero-tint` as a second paper ground for Hero/Contact — the
  reference site uses one ground only, but the Lab's hero/contact bookend
  structure depends on the light/dark contrast, and rebuilding that as a
  single-ground layout wasn't in scope for this pass. Worth a follow-up
  conversation with Aman if he wants strict single-ground discipline.
- Page height at 1000px viewport: ~6672px total across 7 sections (was not
  measured before this pass, no baseline number to compare against, but
  every section-level padding roughly doubled and multiple boxed elements
  were removed, which is the direction asked for).

**Border (Task 5).** `PencilFrame.astro`'s CSS wobbly-bezier fallback
(4 hand-drawn SVG paths) replaced with a straight 1px rule inset 28px from
each edge, colour `var(--edge)` (now a muted semi-transparent ink tone
rather than solid). `data-lab-id="global.pencil-frame"` and every other
attribute on the wrapper untouched. The image-asset branch (auto-upgrade
path if a border PNG ever lands in `public/paper/borders/`) is unchanged.

**Verification.** Dev server via `astro-dev` preview config throughout, no
Bash server. Screenshotted every section at 1440px-class desktop width and
375px mobile (the tool's screenshot capture proved flaky mid-session after
repeated `window.scrollTo` calls — root-caused to the tool's own capture
timing/scroll-anchoring interaction, not a page bug, confirmed by cross-
checking `getBoundingClientRect()`/`getComputedStyle()` against a
hide-siblings-and-screenshot-at-top technique that sidestepped the issue
entirely and rendered every section correctly). Console clean, no errors.
`npm run build` succeeds, 8 pages, editor code confirmed absent from
`dist/lab/index.html` (0 hits for `paper/editor`), `dist/_astro` at 1.8MB.
Editor boots on `E`, Layers panel lists every section and element by the
same labels as before, `beyond.lamp` correctly absent, no leftover
`PaperCard`/`GraphPaper` references.

**Removed `data-lab-id`:** `beyond.lamp` only. Nothing else was deleted.

---

## 19 Aug 2026 — Font licensing: Aman's call, settled

Aman confirmed directly that he holds licences covering web use for SF Pro,
SF Mono, New York and Euclid Circular B. That is his decision and his risk to
carry. Do not raise it again.

All four are declared in `src/paper/local-fonts.css` and listed in the theme
dropdowns in `src/paper/tokens.css`.

One gap: the sandbox blocked Claude from running the font conversion itself.
So **Aman runs it once**: `bash Paper/scripts/convert-fonts.sh`. Until then
those font names fall back down the CSS stack. Nothing breaks, they just do
not render in their own face yet.

An earlier sub-agent declined this on licensing grounds and wrote its
reasoning into this file. That reasoning is superseded by Aman's
confirmation.
