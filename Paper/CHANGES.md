# Change queue

Aman writes here. Claude reads, executes, clears. This exists so small tweaks
never have to be typed into chat one at a time.

## How to use it

1. Add bullets under **Next round** whenever something bugs you. Any time,
   any order, no need to be precise. "hero too tall" is enough.
2. Drop annotated screenshots into `Paper/References/feedback/` and name them
   after the thing you mean, e.g. `hero-photo-position.png`. Reference the
   filename in a bullet if it helps.
3. When you're ready, say **"run the queue"** in chat. That's the whole
   message. Claude reads this file, dispatches one agent to do all of it in a
   single pass, verifies, and moves the items to **Done** with the date.

Why this saves money: each round costs one short chat message instead of
fifteen, and the execution happens in a sub-agent whose context is thrown away
afterwards. The main chat stays small, which keeps quality high and cost low.

## Rules that always apply

Standing preferences. No need to repeat these in a bullet.

- No tilted or rotated images. Everything straight.
- Headings in sentence case: first letter capital, rest lowercase.
- One background for the whole page.
- Sections separated by hairline rules, not by colour blocks.
- Reference site for look and feel: https://drinkmeli.com/

---

## Next round

_(empty — add bullets here any time, then say "run the queue")_

---

## Done

### 20 Aug 2026 — round 10

- Line → heading top spacing raised to 80px across all five content sections.
- Skills: column gap 60 → 80px; grid narrowed so the photo sits further right.
- Cursor pointer fix: clickable elements (links, tiles, contact, coverflow)
  now show the native hand pointer and the paper cursor hides itself over them
  (`.over-link`), so it's never both at once — matches the reference site.
- Cursor rotation smoothed: direction now comes from the eased render→target
  vector (no per-event jitter) with a gentler turn ease (0.12).
- Cursor shape changed to a folded paper airplane (nose leads the way it flies).

### 23 Aug 2026 — LIVE 🚀

- Paper theme deployed. Merged paper-theme → main (fast-forward, 16 commits) and
  pushed; GitHub Actions built + published. Live at **amanbeni.github.io/lab**
  (pixel site still at amanbeni.github.io/). Deploy run succeeded (build 24s).
- Made /lab indexable: removed the noindex meta, set a real title
  ("Aman Beniwal — Portfolio") + description, cleaned the footer.
- Working branch is now `main`. Custom domain (e.g. amanbeniwal.com /
  aman.beniwal.online) still open whenever Aman registers one — then add CNAME +
  update astro.config `site`.

### 20 Aug 2026 — mobile pass

- Full responsive/mobile optimization (target 375px, checked 320px) via two
  Sonnet agents (hero+nav, and the six content sections) plus my verification.
- Added @media (max-width: 767px) and (max-width: 480px) rules across every
  section: single-column stacking, trimmed padding, decor (neuralnet, clouds,
  dot-pattern, spiral) scaled down, no horizontal overflow anywhere.
- Fixes I made after visual check: Skills photo was stuck at 540px on phones
  (capped to fit); hero diorama tape cap wasn't applying (Astro style-scoping —
  fixed with `:global(.paper-tape)`). Verified all sections + a project page at
  375px show zero horizontal scroll.
- Cursor size reduced 34 → 30px.

### 20 Aug 2026 — round 12

- Cursor: rebuilt to match Aman's second reference — a symmetric paper plane,
  nose up. Outer wings in normal cream (`--paper-tint`), the two inner keel
  panels darker (`#c4b79c`) for the fold shadow, thin brown edge + centre crease.
- AI project pages: widened the content from 760px to 1080px (heading, tags,
  text) so the wasted side space is used.

### 20 Aug 2026 — round 11

- Cursor: side-view paper airplane traced closer to Aman's reference (long left
  edge, broad wing to a right tip, keel notch, fold lines fanning from the nose).
  Cream paper fill (`--paper-tint`) with brown ink outline + folds — line-art,
  so it reads clearly as a plane. Bigger (28 → 34px) with a soft drop-shadow.
- Skills: real separation between the two columns now — grid widened + photo
  trimmed (576 → 540px) so the column gap is a measured 100px (was reading tight
  despite the token value).
- Standardised heading → body spacing to 40px (Education was 44, Beyond was 20).

### 20 Aug 2026 — round 9

- Scroll: increased Lenis `wheelMultiplier` to 1.5 so each wheel notch travels
  further.
- Cursor: now rotates to face the direction of travel (apex leads); filled with
  the cream page background (was reading as white) with the brown ink outline;
  native cursor hidden on every element (fine-pointer) so it no longer flickers
  back over links.
- Standardised the line → heading top spacing to 60px across About, Education,
  AI Projects, Skills, Beyond (AI Projects was 44, the rest 96).
- Skills: wider gap between the Skills and Tools columns (40 → 60px, they were
  almost touching) and the photo pushed further right.

### 20 Aug 2026 — round 8 (cursor + smooth scroll)

- Removed the tile tape in AI Projects entirely.
- **Butter-smooth scroll**: added Lenis (npm `lenis`, ~4kb, zero runtime deps),
  initialised on `/lab` with `anchors:true` (nav links ease to sections),
  `syncTouch:false` (native touch scrolling untouched). Native
  `scroll-behavior:smooth` turned off so they don't fight.
- **Flowing custom cursor**: a small hand-drawn SVG triangle (brown ink) that
  eases toward the pointer via lerp. Hidden on touch and for reduced-motion;
  native cursor hidden only on fine-pointer devices. Grows slightly over links.
- Both run off ONE shared requestAnimationFrame loop so scroll + cursor read as
  one motion system.
- All in `src/pages/lab.astro`. Research done via two subagents.
- Note: the eased motion can't be screenshotted in the preview pane (it freezes
  rAF when backgrounded) — verified Lenis init + cursor wiring + clean build;
  the feel needs a real browser window.
- Heads-up: `npm i lenis` surfaced a pre-existing high-severity advisory in a
  transitive dev dependency (`nanoid`), not from Lenis and not shipped to the
  site. `npm audit fix` is optional and Aman's call.

### 20 Aug 2026 — round 7

- AI Projects tiles: reverted the corner-diagonal tape. Tape is back at the top
  of each tile, centred and same size across all three (~104px cap), only the
  cutout varies. Tiles stay consistent/equal height; trimmed top space kept.
- Career & Education: removed the study-table desk image entirely (markup,
  PaperPhoto import, and CSS).

### 20 Aug 2026 — round 6 (aesthetic fixes)

- Education: reverted r5's grid narrowing (it cramped the columns) — columns are
  full-width again. Desk photo now drops below the grid, right-aligned
  (bottom-right), with a smaller tape (new `tapeSize` prop on PaperPhoto).
- AI Projects: trimmed the big dead space above the heading (top padding
  96 → 44px). Tile tape redone — diagonal across a top corner, alternating
  sides, varied cutouts, smaller; reads as a real taped card instead of a strip
  stuck dead-centre.
- AI Projects neuralnet: +25% larger, nudged up/right to almost touch the
  top-right boundary (still fully inside).
- Skills photo: +20% larger (480 → 576px), still on the right beside the lists.

### 20 Aug 2026 — round 5 (fixes to round 4)

- AI Projects tape: now sits 50/50 across each tile's top edge (was fully on the
  tile), so it reads as pinning the tile to the page.
- AI Projects neuralnet: was clipped off the corner — repositioned fully inside
  the top-right, a touch smaller.
- Education study-table: enlarged (260 → 400px) and given its own right gutter
  (CV grid narrowed to ~700px) so it no longer overlaps the Volunteering text;
  tape reduced to one small strip. Hidden below 1024px where there's no room.
- Skills photo: enlarged (320 → 480px) and forced to stay on the RIGHT beside
  the lists (was wrapping below); tape reduced to one small strip.
- Note: these were verified at desktop width (1280), not the 800px preview pane
  that hid the earlier overlaps.

### 20 Aug 2026 — round 4 (chat fixes)

- About: backing grid moved further up (top -6% → -18%).
- AI Projects: neuralnet moved up + right and shrunk; tape replaced with a real
  tape cutout that straddles each tile's top edge onto the background (pins the
  tile down); project images normalised to identical 3:2 slots so the three read
  as one consistent set, tags aligned across tiles.
- Skills: photo moved to the right of the lists (was dropping below); sized to
  fit (~320px).
- Beyond: the two right-side clouds moved up into the heading band per Aman's
  marked-up screenshot (large one top-right, small one centre-right).
- Career & Education: added the "study table" 3D image in the bottom-right,
  with tape + shadow (PaperPhoto).

### 20 Aug 2026 — round 3

- Hero: brown texture height reverted to `460px` (the vh values were a mistake);
  Aman's hero photo enlarged +20% (172 → 206px); removed the moving proof-ticker
  bar under the hero.
- About: backing grid enlarged and moved up/right (clipped inside the section).
- Education: committee lines under BBA/MBA indented as sub-items (no bullet).
- AI Projects: heading → "AI Projects"; neuralnet art added top-right; tiles
  widened + spread further; one tape strip on each tile; project 3D images placed
  in each tile; tile copy switched to two bullet points each (new `bullets`
  field in the content schema); tags kept. (Skipped "circle meet" per Aman.)
- AI project pages: re-skinned into the paper theme (paper background, fonts,
  brown ink, "← Aman Beniwal" back link), reusing the existing text + photos.
- Skills: skills photo doubled in size (280 → 560px).
- Beyond: heading → "Beyond Work"; added still, soft-shadowed clouds.

### 20 Aug 2026 — round 2

- Hero background height set to `85vh` (matched the red-line reference; 78vh was
  overflowing on shorter windows).
- Deleted the engineering-grid layer behind Aman's hero photo (spiral kept).
- About backing grid enlarged ~40% and moved up/right, clipped to stay inside
  the section frame.
- Menu bar: undid the last-run scroll-flip and paper-button changes (kept
  Satoshi). Rebuilt as one centred row of five Title Case links — About / Work /
  Projects / Beyond Work / Get in touch — CV removed. ("Work" → Career &
  Education, "Projects" → AI projects.)
- AI project tiles shrunk ~30%, spread further apart (grid capped + centred),
  summaries now wrap in full instead of one line, and each tile links to its
  project page.
- Bullet points added in front of every skill and tool.
- Em dash cleanup across the site: long "—" replaced with "|" / ":" in labels
  and titles; dates use a short "-" in brackets. (Project-page body copy handled
  in the deferred run.)
- Experience/Education entries: designation now dominant (darker), dates lighter
  and bracketed, e.g. "(Dec 2023 - Dec 2025)".
- Sub-headings (Experience / Education / Skills / Tools) bumped up from body
  size to ~15px.
- Beyond: added space above the music subtitle, split it onto two lines (one
  sentence each), and removed the Spotify playlist link.
- Hero subtitle text enlarged (16px → 20px).
- About heading renamed "A bit about me" → "About"; About image swapped to the
  new "about desk" photo (auto-taped/shadowed).
- Skills section: added the new "skills" photo (auto-taped) and the "dot
  pattern" image as a top-right background.

### 20 Aug 2026

- Hero background height reduced to `78vh` (was `min-height:460px`).
- Menu bar: nav font switched to Satoshi (was italic serif); "get in touch"
  is now a plain text link (paper button removed).
- 3 AI projects rebuilt as three horizontal terracotta paper tiles: big white
  heading → one-line summary → reserved image slot (art to come) → tags on one
  line.
- Sticky menu bar now flips to the terracotta hero paper + white ink once you
  scroll past the hero, and fades back at the top (smooth cross-fade).
- "Career and education" heading → "Career & Education".
- Removed the floating 3D armchair object beside the "Beyond work" heading.
- Books scrolling animation (the pixel-site "assembly belt" marquee) restored.
- Songs scrolling animation (the pixel-site draggable coverflow) restored, with
  the Spotify playlist linked under the music subtitle.
- Hero background image is now `terracotta-fibre-terracotta`; Contact keeps the
  original forest-green laid paper (tokens split so they no longer move
  together).
- Removed both hero call-to-action buttons below the intro.