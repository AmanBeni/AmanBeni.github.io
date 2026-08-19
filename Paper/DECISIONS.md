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
