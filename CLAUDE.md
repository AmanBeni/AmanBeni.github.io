# Portfolio Website — project guide

Aman's personal portfolio. **One Astro app** deployed to GitHub Pages
(`aman-beniwal.github.io`, base `/`) via GitHub Actions on push to `main`.
It serves **two sites from the same build**:

- **`/`** — the **paper** theme. The live site. This is what we actively work on.
- **`/old`** — the **pixel** theme. Archived, kept as a reference for a possible
  future site. Still builds; don't break it, but don't polish it either.
- **`/lab`** — redirects to `/` (the paper site used to live here).

## Where things live

| | Paper (live, `/`) | Pixel (archived, `/old`) | Shared by both |
|---|---|---|---|
| **Code** | `src/paper/**`, `src/pages/index.astro` | `src/components/*.astro`, `src/layouts/BaseLayout.astro`, `src/styles/global.css`, `src/pages/old.astro` | `src/content/**`, `src/pages/work/[...slug].astro`, `src/content.config.ts`, `src/data/` |
| **Served assets** (`public/`) | `public/paper/`, `public/decor/` | `public/hero/`, `public/logos/`, `public/book-covers/` | `public/fonts/`, `public/work/` |

The two themes **share the same project content** (`src/content/projects/*.md`) —
that's intentional, not duplication. The live paper "AI Projects" grid shows 5
of them; the rest exist for later.

## Reference material — DO NOT read unless explicitly asked

These folders are large local-only reference (raw photos, design exports, drafts).
They are **gitignored** (never on GitHub) and **not used by the build**. Do not
grep, read, or load them into context unless the user specifically asks about
them — they will waste the context window otherwise.

- `reference/pixel/` — pixel-era working art, hero visuals, source photos
- `reference/shared-projects/` — project images + content source docs (both themes)
- `reference/design-language/` — general design-language docs & decor
- `Paper/References/` — paper-theme source art (the ~200M originals; web-ready
  copies live in `public/paper/` and `Paper/assets/`)
- `Paper/Fonts/` — raw font originals (web copies in `public/fonts/`)

## Editing AI-project copy

`AI-PROJECTS-CONTENT.md` (repo root) is the single human-editable surface for all
5 AI projects — tile copy + full detail-page content. Aman edits it and shares it
back; sync changes into the matching `src/content/projects/<id>.md` files. Keep
the two in agreement.

## Conventions / gotchas

- **Deploy:** commit + push to `main` only when asked; it goes live.
- **Verify** desktop changes at 1280px and mobile at 375px (not the ~800px
  preview pane). The paper site uses Lenis smooth-scroll, which desyncs
  programmatic scroll + screenshots — prefer reading the live DOM.
- **Never commit `reference/`** or any raw source art — keep the repo lean.
- Section content width is one knob: `--content-max` in `src/paper/tokens.css`.
