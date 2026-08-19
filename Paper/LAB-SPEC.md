# LAB-SPEC — contract for the paper Lab

Technical spec. Two build tracks share this file so they stay compatible.
**Track A** builds the page and the paper theme. **Track B** builds the editor
and the dev-server endpoints. Neither track edits the other's files.

Stack: Astro 7, Tailwind v4 (via `@tailwindcss/vite`), no UI framework.
Editor is plain TypeScript/JS. No new runtime dependencies.

---

## 1. Files

**Track A owns:**
```
src/pages/lab.astro              the Lab page
src/paper/tokens.css             paper design tokens (CSS variables)
src/paper/sections/*.astro       hero, about, education, work, beyond, contact
src/paper/components/*.astro     PaperCard, PaperObject, TapeStrip, PencilFrame...
```

**Track B owns:**
```
src/paper/editor/index.ts        entry, boot, keyboard
src/paper/editor/state.ts        state model, load/save, undo/redo
src/paper/editor/select.ts       hit-testing, selection, handles
src/paper/editor/drag.ts         move / resize / rotate gestures
src/paper/editor/panel.ts        the side panel UI (layers + properties)
src/paper/editor/assets.ts       asset picker, drag-drop upload
src/paper/editor/editor.css      editor chrome styling (scoped, `.lab-*`)
plugins/lab-dev-server.mjs       Vite dev middleware (see §6)
```

**Shared, Track A creates and Track B reads:** the DOM contract in §2.

`astro.config.mjs` gets one line added by Track B to register the Vite plugin.

---

## 2. DOM contract

Every element Aman can touch carries these attributes. Track A puts them in the
markup. Track B reads them and never invents its own.

```html
<h1
  data-lab-id="hero.title"
  data-lab-kind="flow"
  data-lab-label="Hero heading"
  data-lab-group="Hero"
  data-lab-props="fontSize,letterSpacing,lineHeight,color,align,marginTop,marginBottom,maxWidth,font"
>Hi, I am Aman</h1>
```

| Attribute | Meaning |
|---|---|
| `data-lab-id` | Unique, stable, dot-namespaced `section.thing`. This is the key everything is stored under. Never reuse or renumber. |
| `data-lab-kind` | `flow` or `free`. See §3. |
| `data-lab-label` | Human name shown in the layers list. |
| `data-lab-group` | Section name for grouping the layers list. |
| `data-lab-props` | Comma list of which controls to show for this element. From the vocabulary in §4. |
| `data-lab-variant-of` | Optional. Marks this element as an alternative to another id. Two elements sharing a `data-lab-variant-of` value form a toggle group; exactly one is visible at a time. |
| `data-lab-asset` | Optional. `backgrounds` \| `objects` \| `text` \| `borders` \| `photos`. Makes the element's image swappable from the asset picker. Applies to `<img>` (sets `src`) or any element (sets `background-image`). |

Sections themselves are elements too (`data-lab-kind="flow"`, props
`paddingTop,paddingBottom,background,maxWidth`).

---

## 3. The two kinds

**`flow`** — normal document flow. The editor never sets `position:absolute`.
Dragging a flow element:
- vertical drag adjusts `marginTop` / `marginBottom` on a **4px grid**
- horizontal drag past 40% of a sibling's width **reorders** it among siblings
  (via CSS `order`), it does not float
- corner drag adjusts `maxWidth` (percentage of parent)
- output is always relative units, never absolute coordinates

**`free`** — absolutely positioned inside the nearest ancestor marked
`data-lab-canvas`. Dragging sets `left`/`top` as a **percentage** of that
canvas. Also supports `rotate`, `scale`, `z`. Never pixels.

Both kinds support hide/show and opacity.

---

## 4. Property vocabulary

Track B implements exactly these. Track A only ever names these in
`data-lab-props`.

| Prop | Control | Unit / range | Applied as |
|---|---|---|---|
| `fontSize` | slider + number | 10–160 px | `font-size` |
| `lineHeight` | slider | 0.8–2.4 | `line-height` |
| `letterSpacing` | slider | -0.1–0.4 em | `letter-spacing` |
| `fontWeight` | segmented | 300/400/500/600/700 | `font-weight` |
| `font` | dropdown | token names from §5 | `font-family` |
| `color` | swatches + hex | ink tokens | `color` |
| `align` | segmented | left/center/right | `text-align` |
| `maxWidth` | slider | 20–100 % | `max-width` |
| `marginTop` / `marginBottom` | slider + number | -80–200 px, 4px steps | margin |
| `paddingTop` / `paddingBottom` | slider + number | 0–240 px, 4px steps | padding |
| `gap` | slider | 0–120 px, 4px steps | `gap` |
| `background` | asset picker + color | manifest ids or hex | `background-image` / `background-color` |
| `x` / `y` | drag + number | 0–100 % | `left` / `top` (free only) |
| `rotate` | slider | -30–30 deg | `transform` |
| `scale` | slider | 0.2–3 | `transform` |
| `z` | layer reorder | integer | `z-index` (free only) |
| `opacity` | slider | 0–1 | `opacity` |
| `shadow` | segmented | none/soft/lifted/deep | paper shadow presets |
| `src` | asset picker | manifest id | `<img src>` |

Unrecognised props in a saved file are kept as-is and ignored, never dropped.

---

## 5. Theme tokens (Track A)

`src/paper/tokens.css` defines the whole look as CSS variables on `:root`, so
the editor can change the entire site's mood by setting a handful of values.

```
--paper-stock        background-image, from the manifest
--paper-tint         flat colour under the texture
--ink                main text colour
--ink-soft           secondary text
--accent             one accent colour
--font-display       headings
--font-body          body text
--font-mono          typewriter / labels
--grain              0–1, strength of the paper grain overlay
--shadow-soft/-lifted/-deep   paper drop shadows
--edge               pencil/torn border treatment
```

A **global theme bar** at the top of the editor panel edits these directly.
Changing `--paper-stock` restyles the entire page in one click. This is the
"try 20 backgrounds in 20 seconds" feature.

Fonts: install via `@fontsource/*`. Aim for a typewriter face (e.g. Courier
Prime, Special Elite), the existing JetBrains Mono, and a Didone/serif display
face (e.g. Playfair Display) to match the Figma mock. If a package fails to
install, pick the closest available and note it in `Paper/DECISIONS.md`.

---

## 6. Dev endpoints (Track B)

A Vite plugin at `plugins/lab-dev-server.mjs`, registered in
`astro.config.mjs` under `vite.plugins`. **Dev only** — it must be inert in a
production build, so the deployed site never exposes these.

| Route | Method | Does |
|---|---|---|
| `/__lab/state` | GET | returns `Paper/saved/lab-state.json`, or `{}` |
| `/__lab/state` | POST | writes `Paper/saved/lab-state.json`. Before overwriting, copies the old one to `Paper/saved/history/lab-state-<timestamp>.json` |
| `/__lab/assets` | GET | reads `public/paper/manifest.json`, plus scans `public/paper/**` for files not yet in it, returns the merged list |
| `/__lab/upload` | POST | multipart. Writes the file into the matching `Paper/References/Lab Files/<category>/`, then runs `Paper/scripts/process-assets.mjs`, then returns the new manifest |

Reject any path that escapes those directories. Only image extensions.

---

## 7. Saved file format

`Paper/saved/lab-state.json`:

```json
{
  "version": 1,
  "savedAt": "2026-08-19T12:00:00.000Z",
  "note": "free text Aman can type before saving",
  "theme": {
    "--paper-stock": "backgrounds/kraft-scan-brown",
    "--ink": "#1f1b16",
    "--font-display": "Playfair Display",
    "--grain": "0.35"
  },
  "elements": {
    "hero.title":  { "fontSize": 72, "letterSpacing": -0.02, "marginBottom": 24 },
    "hero.desk":   { "kind": "free", "x": 62.5, "y": 18.2, "rotate": -3, "scale": 1.1, "z": 4 },
    "hero.cloudscape": { "hidden": true },
    "about.heading": { "variantActive": "about.heading.image" }
  },
  "order": { "work.grid": ["work.card3", "work.card1", "work.card2"] }
}
```

Only changed values are written. An element Aman never touched has no entry.
This keeps the file small and makes it obvious what he actually cared about.

---

## 8. Editor UX (Track B)

- **`E`** toggles edit mode on and off. Off = the site as it really is.
- Panel docks right, ~320px, collapsible, remembers width.
- **Layers tab**: sections as groups, elements nested under them. Eye icon to
  hide. Click a row to select. Drag rows to reorder `free` items front to back.
  Selected element highlights on the page and vice versa.
- **Properties tab**: only the props named in `data-lab-props`. Every slider has
  a number box for typing exact values.
- **Theme tab**: the §5 tokens, background picker as a thumbnail grid.
- **Assets tab**: thumbnail grid per category. Click a thumbnail while an
  element is selected to swap its image. Drag a file from Finder anywhere onto
  the page to upload it (§6).
- Selection: click to select, `Esc` to deselect, `Tab` for next sibling,
  arrow keys nudge (Shift = 10x), `Alt+drag` to duplicate a `free` element.
- **Undo/redo** on `Cmd+Z` / `Cmd+Shift+Z`, at least 50 steps.
- **Breakpoint buttons**: Desktop / Tablet / Phone. Resizes the canvas so Aman
  sees the real mobile layout without leaving the Lab.
- **Save** button, plus `Cmd+S`. Shows a clear confirmation with the file path.
- **Reset** clears overrides for the selection, or for everything with a
  confirm step.
- State autosaves to `localStorage` continuously so a refresh never loses work.
  `Cmd+S` is what writes the real file for Claude to read.

Editor chrome must never affect the page's own layout: overlay only, all
classes prefixed `.lab-`, panel in a fixed container, no wrapper divs injected
around content.

---

## 9. Non-negotiables

1. No absolute pixel coordinates written for `flow` elements. Ever.
2. The editor is dev-only. It must not ship in `npm run build`. Verify by
   grepping the built `dist/` for `lab-` after a build.
3. Never write to `Paper/References/`, except `/__lab/upload` adding new files.
4. Every element the editor can touch needs a `data-lab-id`. If Track B needs
   to touch something without one, ask, don't invent.
5. Real content only. Pull the actual copy from `src/pages/index.astro` and
   `src/content/projects/*.md`. No lorem ipsum.
