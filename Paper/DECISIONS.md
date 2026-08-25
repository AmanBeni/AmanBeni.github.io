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

---

## 19 Aug 2026 — Execution round: standing rules, settled

Ran the focused change list (background, frame, hero height/layout, no
tilts, no shadows, sentence-case headings, restored About heading, restored
Contact's green ground, bigger body text). Writing down what's now settled
so it isn't re-litigated:

- **No drop shadows, anywhere.** `--shadow-soft`/`--shadow-lifted`/
  `--shadow-deep` are zeroed to `none` in `tokens.css` (kept defined, not
  deleted, so nothing that references them breaks). Every `box-shadow` and
  `filter: drop-shadow` in `src/paper/sections/*` and `TapeStrip.astro` was
  removed at the source too, not just masked by the token.
- **No tilts, anywhere.** Every `transform: rotate(...)` on an image, photo,
  or tape strip is gone. `TapeStrip`/`PaperObject` still accept a `rotate`
  prop (machinery, unused by default) — nothing calls them with a non-zero
  value any more.
- **Headings are sentence case**, done via `text-transform: lowercase` +
  `::first-letter { text-transform: uppercase }` on each heading class,
  rather than rewriting content strings — robust to whatever text a section
  holds. One side effect worth flagging: "AI Projects" renders "Ai
  projects" under this rule (acronym gets lowercased). That's the literal
  reading of "first letter capital, rest lowercase" — revisit if Aman wants
  acronyms exempted.
- **Flat cream ground by default.** `--paper-stock: none`, `--grain: 0.02`.
  The asset list and the grain/noise machinery are untouched — just not on
  by default. Hero and Contact keep their own textured green ground
  (`--paper-hero-bg`), which is a background-image, not the grain knob, so
  it wasn't part of this flattening.
- **Framed page.** `PencilFrame.astro` existed but was never imported into
  `lab.astro` — that's why the edges looked bare. Now mounted at the top of
  `<body>`, switched from `position: fixed` (viewport-only) to `position:
  absolute` against a `position: relative` body, and its hardcoded 28px
  inset replaced with `--page-inset`, so the rule runs the full scrollable
  height of the page, not just one screen.
- **Contact bookends the page.** It now carries the same
  `--paper-hero-tint` / `--paper-hero-bg` / `--paper-hero-ink` treatment as
  Hero — this had been removed at some point and needed restoring, per
  Aman's note.
- **Body copy is ~18px**, up from 16px; smaller mono/label text scaled up
  by roughly the same proportion throughout. Verified via `npm run build`
  (8 pages, editor code still absent from `dist/lab/index.html`) and in
  the dev preview at 1440px and 375px — console clean apart from the
  already-known, expected Euclid Circular B 404 (font not yet converted
  locally).

---

## 20 Aug 2026 — Brown ink + Meli teardown pass

**Brown ink.** Aman wants all text on the light ground in brown: `--ink`
#4a3527, `--ink-soft` and the hairline rules follow the same hue. The dark
green hero/contact keep cream text (`--paper-hero-ink`) since brown on green
is unreadable. Note: the teardown doc explicitly warns brown+cream is the one
combination that reads as a direct Meli copy and suggests moss/charcoal
instead. Aman was told and chose brown anyway. His call, settled.

**From the teardown (`Paper/References/meli-design-teardown-by GTP.md`),
implemented with judgment, not wholesale:**
- Hero CTAs: two equal dotted-outline routes, "View selected work" /
  "Read my background" (doc section 2 row 5). `hero.ctas`.
- Proof ticker under the hero: a slow marquee of capabilities
  (Strategy, Operations, Data, AI systems, Executive communication),
  reduced-motion safe (doc row 6). `src/paper/components/ProofTicker.astro`,
  id `proof`.

**Deliberately NOT done** (out of scope for a styling pass; content-IA
decisions for Aman to call separately): multi-page IA rewrite, renaming nav
to Notes, case-study restructuring, a testimonials module, rewriting copy to
"editorial field notes", moss/charcoal palette.

---

## 20 Aug 2026 — Queue run: fonts, tape, photo shadow, paper button

**Two fonts only.** Headings stay Sorts Mill Goudy. Body, nav labels, ticker
and small UI all collapse to one sans via `--font-body`; `--font-mono` now
aliases `--font-body` so there is no typewriter face anywhere (Courier Prime
rejected). Nav keeps the Goudy italic, which reuses the heading font, so the
count is still two. Three sans options offered and installed/ready: Satoshi
(default, Aman's licence), Inter, Manrope. To switch site-wide, change the
first name in `--font-body` in `src/paper/tokens.css`.

**PaperPhoto component** (`src/paper/components/PaperPhoto.astro`) now owns
photo presentation: a two-layer paper-lift shadow (light always top-left,
cast down-right, kept low) plus masking tape. Any photo using PaperPhoto gets
both automatically, which is how new images get taped/shadowed with no extra
work. Tape is chosen deterministically from a `seed` prop from the 6 real
cutouts in `public/paper/tape/`; small photos get 1 strip (top centre), large
get 2 (top corners). Tape 57 (aspect ~4.8) is excluded from the default pool
as too long even when scaled. Standing behaviour now: photos carry a subtle
shadow and tape. (Note: the blanket "no shadows" rule was earlier narrowed by
Aman; shadows on photos are wanted, shadows elsewhere are not.)

**Paper button.** The Framer marketplace "Paper button" is proprietary JS and
cannot be imported. Rebuilt the effect in CSS on `.site-contact`: a raised
paper chip lit from the top-left, lifting on hover and pressing on click.

Tape pipeline: `Paper/scripts/process-assets.mjs` gained a `tape` category
sourced from `Paper/References/Tape/` (outside Lab Files), PNG to keep alpha.

---

## 20 Aug 2026 — Decor layers, tape/shadow fixes, font options sent

- **Font choice pending.** Sent Aman a self-contained `Paper/font-options.html`
  (three body fonts side by side, fonts embedded as data URIs). Default stays
  Satoshi until he picks. To switch: first name in `--font-body` in tokens.css.
- **Decor overlays.** Two transparent line-art PNGs added in `public/paper/decor/`:
  `spiral-dotted.png` (golden-ratio spiral) sits large behind the hero diorama
  over the right of the panel; `litho-grid.png` (engineering grid) sits behind
  Aman's photo as a backing sheet. Both use `mix-blend-mode: screen` so the
  light lines lift off the dark green. Both `pointer-events:none`, behind their
  subject (z-index 0 vs subject z-index 1).
- **Diorama** now uses PaperPhoto too, so it gets tape + shadow, and moved down.
- **Tape bug fixed.** `(h >> 3)` went negative for some seeds, producing
  `undefined.png` (a 404) for the second tape. Now `(h >>> 3)`, unsigned.
- **Tape 50/50.** Tape is centred on the photo's top edge (translateY(-50%)),
  half on the board, half on the photo, per Aman.
- **Shadows increased** on PaperPhoto.

---

## 20 Aug 2026 — Spacing, About grid, font options expanded

- **Tighter spacing.** Section padding 160->96px (Contact 180->110), heading
  bottom margins 80/88/64 -> 40/44/40, Beyond music gap 96->52. Aman felt
  there was too much empty space around headings.
- **About backing grid.** litho-grid now also sits behind the desk photo in
  About (cream ground, no blend), shifted down-left so it peeks like a backing
  sheet, per Aman's reference. `.about-litho`.
- **Fonts.** All Apple faces were already converted (Aman ran
  convert-fonts.sh): public/fonts/apple has NewYork, SF-Pro-Display-Regular,
  SF-Pro-Text-Thin woff2. Added to `--font-body-options`: Satoshi, Satoshi
  Static, Inter, Manrope, New York, SF Pro Display, SF Pro Text. Satoshi Light
  + Regular both available via Satoshi Static (300/400) and the variable face.
- **font-options.html** rebuilt with all seven as columns, fonts embedded as
  data URIs. SF Pro woff2 were 3.1MB each; subset to the sample text (~5KB)
  with pyftsubset so the file stays ~390KB.

Dev note: `astro dev` served a stale stylesheet after edits (heading margin
still 80px, .about-litho rule absent) until the server was killed and
restarted. When edits do not appear, restart the dev server rather than
trusting HMR.

---

## 20 Aug 2026 — Queue round (terracotta hero, project tiles, motion restored)

Ten-item change queue, split by model per Aman's new rule: mechanical single-
file edits to a Sonnet 4.6 sub-agent (Hero.astro, tokens.css, Education.astro),
taste/interconnected work kept on Opus (lab.astro nav, Work.astro tiles,
Beyond.astro motion).

- **Terracotta hero.** Added `--paper-terracotta-bg` / `--paper-terracotta-tint`
  (#8a4a30) tokens and pointed `.paper-hero` at them. Deliberately did NOT
  repoint the shared `--paper-hero-*` tokens, because Contact reuses them for
  its forest-green bookend — Aman wants the hero terracotta but Contact to stay
  green. The two grounds are now independent.
- **Hero height** `min-height: 78vh` (was 460px), so the hero fills most of the
  first screen. Both hero CTAs removed.
- **Project tiles.** Work section moved from a quiet stacked list to three
  side-by-side terracotta paper tiles (grid, 3 cols → 1 col under 860px). Order
  Aman specified: big white serif heading → strict one-line summary (nowrap +
  ellipsis) → reserved image slot (faint inset panel; he supplies art later) →
  tags on one line. Paper-lift shadow + soft-light grain so the tile reads as
  stock, matching the photo language.
- **Scroll-reactive nav.** Header ink is now a `--nav-ink` variable; an
  IntersectionObserver on `#hero` toggles `.is-scrolled`, which flips
  `--nav-ink` to cream and cross-fades a terracotta `::before` layer in. Chose a
  pseudo-element opacity cross-fade over swapping `background-image` because the
  latter can't tween. Nav font is now Satoshi (was italic serif) and "get in
  touch" is a plain link (paper button dropped).
- **Motion restored from the pixel site.** Books are the continuous "assembly
  belt" marquee again (list ×2, `translateX(-50%)` loop, hover-pause, reduced-
  motion falls back to a scroll container). Songs use the pixel `Coverflow`
  component (imported from `src/components/`), draggable + autoplaying, with the
  Spotify playlist linked under the subtitle (`onRepeat.source`). Dropped the
  floating armchair object near the Beyond heading.

Verified: `npm run build` passes (8 pages); nav flip, tiles, marquee and
coverflow confirmed in the browser. The throttled Browser pane made
`getComputedStyle` reads unreliable while hidden — the screenshot was the
source of truth for the nav flip.

---

## 20 Aug 2026 — Queue round 2 (token-lean pass)

Aman flagged low token budget; priority was cost. Approach: locked the four
risky calls up front with one batched question set, then delegated the whole
queue to two Sonnet 4.6 sub-agents split by file (no collisions) — Agent A owned
lab.astro/Hero/Work/Education/Beyond/Contact, Agent B owned About/Skills plus
their new-image asset processing. Opus only read the hero-height reference image,
wrote the agent specs, and did a single build + focused visual verification.

Decisions confirmed with Aman:
- Nav "Work" → Career & Education (#education); "Projects" → AI projects (#work).
- Kept Satoshi for the nav (undid only the scroll-flip + button, not the font).
- Nav rebuilt as one centred row of five Title Case links, CV dropped.
- Hero height → 85vh (red-line reference; the earlier 78vh min-height was being
  overrun by content on his shorter window, so it read as ~full height).
- AI project-page import (item 50) deferred to its own run; tiles link out to
  the existing pages meanwhile.
- Em dash rule: "|"/":" for label/title separators, short "-" in bracketed
  dates. Applied across section files; the summary em dash in
  `src/content/projects/youtube-year.md` (the only one surfacing on /lab) was
  fixed to a comma. Remaining project-md em dashes deferred with the page import.

Verified: `npm run build` passes (8 pages); nav, hero (height + grid removed +
bigger subtitle), About (rename + new desk photo + grown grid), Work tiles
(smaller/spread/wrapping/linked), Skills (bullets + photo + dot-pattern) all
confirmed by screenshot. skills.webp served 200 (the naturalWidth=0 flag was a
below-fold lazy-load false positive).

---

## 20 Aug 2026 — Queue round 3 (three parallel agents)

Large queue, token-constrained. Locked 4 rework-risky calls up front (only
neuralnet top-right not circle-meet; minimal paper wrapper for project pages;
keep tile tags; cursor + smooth-scroll deferred to their own run), then ran
THREE Sonnet 4.6 agents in parallel split by file to avoid collisions:
- AI Projects cluster: Work.astro + content.config.ts (+ `bullets` field) + the
  3 project .md files + assets (neuralnet, 3 project 3D images).
- Other sections: lab.astro (ticker removed), Hero (460px height + photo +20%),
  About (grid bigger/up/right), Education (sub-item indent), Skills (photo 2x),
  Beyond (heading + still shadowed clouds + cloud assets).
- Project pages: re-skinned src/pages/work/[...slug].astro into the paper theme
  (reused old text/photos, paper shell + back link).

Notable decisions:
- Tiles now carry tape (TapeStrip), so `.work-tile` went overflow:visible with
  the grain ::after taking over the clip so corners stay rounded and the tape
  overhang isn't cut.
- Bullets stored as an optional `bullets` array in the projects schema; tile
  renders bullets when present, else falls back to the summary paragraph.
- Project pages import (previously deferred) done this round at Aman's request,
  minimal effort.

One collision was observed and self-healed: a project-pages build raced a
concurrent lab.astro edit (ticker removal); the retry built clean. Final
`npm run build` passes 8/8. Verified by screenshot: AI Projects (neuralnet +
tape + bullets + images), Beyond clouds, and a re-skinned project page.

Still open (own run): custom cursor + butter-smooth scroll.

---

## 24 Aug 2026 — mobile round 2 (phone bugs from IMG_6317/18/19)

Ten phone-only fixes. Split main-chat (taste/critical/interconnected) vs one
Sonnet sub-agent (three isolated section files: Work / Skills / Beyond). No file
collisions — the agent owned those three sections; the main chat owned lab.astro,
Hero.astro, PaperPhoto.astro.

Notable decisions / gotchas:
- **The "boundary line going out" was iOS-only horizontal scroll.** In Chrome
  emulation the page overflow is 0 at every width (320/375/393) — every stray
  decor/photo lives inside an `overflow:hidden` section. So the bug never
  reproduced in the preview pane. Diagnosis: on real iOS Safari the page scrolls
  sideways, and because the PencilFrame is `position:absolute; inset:0` on
  `<body>`, the right rule gets pushed past the screen edge (exactly what the
  screenshot shows). Fix chosen: `html { overflow-x: hidden }` — a hard,
  device-agnostic guard rather than chasing which element iOS fails to clip.
  Kept it on `html` (not `body`) so the sticky header keeps working.
- **Astro child-scope gotcha bit again.** `.hero-photo-wrap .paper-photo { width }`
  silently missed (`.paper-photo` belongs to PaperPhoto's scope, not Hero's).
  Needed `:global(.paper-photo)`. Caught it because the live measurement still
  read 224px after a clean dev-server restart — i.e. verify the number, don't
  trust the edit.
- **Tape normalisation lives in PaperPhoto**, not per section — one `.paper-tape`
  cap (72px ≤767, 58px ≤480) so every photo matches. Removed Hero's old
  per-section `:global(.paper-tape)` caps so they don't fight the global one.
- **Polaroid is an opt-in `frame="polaroid"` prop on PaperPhoto** (white card +
  taller foot; the paper-lift shadow moves from the photo to the card). Reusable
  for any future photo; applied to the hero headshot on both mobile and desktop.
- **Beyond clouds cascade down the RIGHT edge on phone.** The heading is
  left-aligned and fills the narrow width, so the only clear sky is on the right;
  a left cloud sat invisibly behind the heading. Two clouds right-side (top +
  lower) read cleanly.
- **Mobile notice** is phone-only + once-per-session (sessionStorage); `[hidden]`
  made authoritative over the base `display:flex` so dismiss fully removes it.

Verified at 320 / 375 / 393 (real device width) / 1280; page overflow = 0 at all
narrow widths; `npm run build` passes 8/8.

## 25 Aug 2026 — frame fix, take 2 (the real one)

The 24 Aug `html { overflow-x: hidden }` guard did NOT fix the frame on Aman's
actual iPhone — the right/left border rules still sat outside the content. Root
cause was structural, not just overflow: PencilFrame was an absolutely-positioned
overlay (`inset:0` against `<body>` with side rules at `var(--page-inset)`), so
its horizontal position depended on the body box, which iOS measures differently
under any residual overflow — the rule decoupled from the content and drifted.

Fix: **retired the overlay frame; the border is now on a `.page-frame` wrapper
that contains all the content** (ticker + header + main + footer). Because the
sections are children of the bordered box, the four rules are always exactly at
the content edges — they cannot render outside the content on any browser, even
if some element still overflows. `overflow-x: clip` on the wrapper stops
anything poking past the side rules (clip rather than hidden, so the sticky
header keeps sticking to the viewport — verified). Inset moved from
`body { padding-inline }` to `.page-frame { margin-inline }` (16px, 10px ≤480).

`PencilFrame.astro` is now unused (import + usage removed from lab.astro); left
in the tree in case the border-image upgrade path is ever wanted, but it no
longer renders. Verified content strictly inside the frame + 0 page overflow at
320 / 393 / 1280; sticky header works; desktop unchanged; build 8/8.
