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

### 27 Aug 2026 — more space between About text and the Experience/Education heading

- The merge above trimmed this gap too far ("too close" — Aman). Bumped it
  back up: desktop/tablet 80px → 120px, 767px 40px → 72px, 480px 24px → 48px
  (split across About's bottom padding + Education's top padding). Verified
  on desktop (hero hidden to work around the preview pane's blank-on-scroll
  quirk) and mobile (393): clear breathing room both above and below the desk
  photo before "Experience"/"Education". 0 overflow. Build 8/8.

### 27 Aug 2026 — merge About + Career & Education, drop "Work" nav link

- Removed the "Career & Education" heading and the hairline that divided
  About from Education — they now read as one continuous section, "About".
  Education kept its own `<section id="education">` in the DOM (anchors,
  component boundary unchanged); only the visible heading + seam are gone.
  Trimmed the padding around the seam (About bottom 96→40/24/16px per
  breakpoint; Education top 80→40/16/8px) so the gap reads as normal
  paragraph spacing, not an orphaned gap where the heading used to be.
- Removed the "Work" link from the top nav (it pointed at #education, which
  no longer has its own visible boundary). Nav is now About · Projects ·
  Beyond Work · Get in touch.
- Verified desktop (1280) and mobile (393): no heading, no dividing line,
  natural flow from About's last paragraph → desk photo → Experience; nav
  confirmed on both. 0 horizontal overflow. Build 8/8.

### 26 Aug 2026 — mobile: starburst repositioned (from marked-up screenshot)

- On the stacked mobile layout the cream starburst moved from the bottom-left
  corner into the gap between Aman's photo and the spreadsheet — right of the
  photo, overlapping the bottom of the photo and the top of the spreadsheet a
  little (deliberate, sits behind both at z-index 0), per Aman's red-circle
  screenshot. Desktop untouched (still the corner placement). Verified 0
  overflow at 320/393; build 8/8.
- Follow-up: nudged it further down (`top` 33% → 44%, width 44% → 46%) so the
  rays visibly reach into/behind the spreadsheet's top edge instead of
  stopping short in the gap above it — then dialled back (44% → 39%, Aman:
  "too much below") once it touched but before it got buried under the sheet.

### 26 Aug 2026 — hero photo nudge + About copy

- Hero (desktop only): Aman's photo + its tape nudged right (+48px) and up
  (-22px) via a relative offset, scoped to `min-width: 861px` so mobile
  (which centres the photo) is untouched.
- Hero: the spreadsheet + its tapes nudged up (`top` 24% → 15% of the panel).
  Verified the tape stays clear of the panel's top edge (48px margin, not
  clipped).
- About paragraph 1: "$3B global transformation program" → "$6B".
- About paragraph 2: "Took a career break in January 2026 due to personal
  reasons." → "Took a career break in January 2026 to focus on certain
  important personal responsibilities and introspect on the career journey
  ahead." Same markup renders on both web and phone, so one edit covers both.
- Note: `src/pages/index.astro` (the old pixel-theme homepage, still live at
  the bare domain) also says "$3B" — left as-is since only the paper theme
  was in scope; flag if that should match too.

### 26 Aug 2026 — hero: spreadsheet spacing + corner starburst

- Spreadsheet shifted left (was almost touching the right frame border, ~9px
  gap) and grown another 10% (44% → 48% of the panel). Now 34px clear of the
  right edge at desktop width.
- Added `circle meet.png` (Lab Files) to the hero's bottom-left corner,
  recoloured brown → cream (`#f4efe0`, matches `--paper-hero-ink`, the hero's
  own text colour) via a sharp alpha-preserving recolour, not a CSS filter —
  keeps the fine dotted-line texture crisp. Sits behind everything (z-index 0),
  clipped by the section so it can't spill; peeks from the corner behind
  Aman's photo. New asset: `public/paper/decor/circle-meet-cream.webp`.
- Verified desktop (1280): gap from right edge, starburst visible in the
  corner. Mobile (393): 0 overflow, starburst still peeks at the bottom-left.
  Build 8/8.

### 26 Aug 2026 — hero spreadsheet: size, tapes, shadow

- Desktop size grown (34% → 44% of the panel column) — it read too small for
  a text-bearing object.
- New `tapeMatch` prop on PaperPhoto: the right tape is now the SAME cutout as
  the left, mirrored (`scaleX(-1)`), so both strips match in width and lean
  symmetrically toward the centre instead of two different tapes at odd
  angles. Opt-in — only the hero spreadsheet uses it; every other photo is
  unaffected (checked).
- Shadow deepened specifically on this image (white sheet needed more
  separation from the terracotta ground than the default photo shadow).
- Verified desktop (1280): larger, tapes matched (122×152 each, mirrored,
  same source), image stays inside the hero panel. Mobile (393): still 0
  overflow, tapes matched (54px each), inside frame. Build 8/8.

### 26 Aug 2026 — hero: "about me" spreadsheet

- Replaced the yellow renewables diorama with `xlscr.webp` — a screenshot of an
  Excel workbook whose cells summarise Aman (Role, Based, Now, Looking for, North
  star, The plan, Fuel). Generated in Vertex AI, converted to webp (782×529, 50KB),
  dropped in `public/paper/objects/`.
- Removed the golden-ratio spiral decor (element + all CSS) that sat behind it.
- Kept `size="large"` on PaperPhoto so the sheet is taped at both top corners.
- Grew the mobile size (210 → 300px) so the small cell text stays legible.
- Fixed a real production bug found along the way: a `<figure>` carries a UA
  default `margin-inline: 40px` that PaperPhoto never reset, shoving the centred
  sheet 40px right (past the frame) when stacked. Reset it for `.hero-side` in the
  stacked breakpoint (left the other photos alone — their approved desktop layouts
  were tuned with the offset present). Verified centred + inside frame + 0 overflow
  at 393; desktop unchanged; build 8/8.

### 25 Aug 2026 — mobile round 3

- **Mobile notice** made subtle + self-dismissing: a small soft-ink card,
  centred at the bottom, that fades itself out after 3s (tap or the × dismisses
  sooner). Final copy: "This site is optimised for desktop." (one line). Shape
  is a soft rounded rectangle (not a pill — matches the paper cards), fully
  opaque (no translucency), with a small × on the right.
- **Skills dot decor** anchored into the top-right corner so it touches the
  section's top rule and the right frame border and reads from there
  (top:0/right:0 at ≤767; section clips overflow so it stays inside).
- **About desk photo** on phones: was full-column and hugging the right edge
  (no desktop-style right column exists there); now shrunk to 80% and centred,
  nudged ~12px left, so it reads as a centred object. Litho backing stays
  full-width and peeks behind. Verified centred and clear of the right border.

### 24 Aug 2026 — mobile round 2 (phone bugs)

Ten phone issues from IMG_6317/6318/6319 (feedback folder). Split: a Sonnet
sub-agent did the three isolated section tweaks (neuralnet / skills-dot / clouds
+ books); the main chat did the critical/taste/interconnected ones. Verified at
320 / 375 / 393 (real device width) and 1280.

- **Horizontal overflow / frame push-out (the "boundary line going out of the
  boundary line").** First attempt (`html { overflow-x: hidden }`) did NOT hold
  on real iOS — the old PencilFrame was an absolute overlay (`position:absolute`
  against `<body>`) whose right rule decoupled from the content and drifted off
  the edge on iOS, independent of the page scroll. **Real fix (r2): retired the
  overlay frame.** The four rules are now a real `border` on a `.page-frame`
  wrapper that *contains* every section, so the lines sit at the content edges
  by construction and cannot leave them on any device. `overflow-x: clip` on the
  wrapper (clip, so the sticky header still works) means nothing pokes past the
  side rules. Verified: content strictly inside the frame + page overflow 0 at
  320/393/1280; sticky header confirmed working. (`html { overflow-x: hidden }`
  kept as a belt.)
- **Hero image sizing.** Headshot shrunk on phones (206 → 132px img) and centred;
  diorama grown (168 → 210px) so it reads as the larger object; golden-ratio
  spiral brought back up (52 → 84% at ≤480, 60 → 92% at ≤767) — it had shrunk
  to a faint sliver. Photo-width override needed `:global(.paper-photo)` (the
  Astro child-scope gotcha) — the first attempt silently missed.
- **Tape size normalised.** One constant tape size site-wide on phones, capped
  in PaperPhoto (`.paper-tape` max 72px ≤767, 58px ≤480). Removed Hero's old
  per-section tape caps so nothing fights it. Tapes now read consistent (~58-62)
  across every photo instead of big-on-the-diorama / small-elsewhere.
- **Neural-net decor removed on phone** (`display:none` ≤767, Work.astro).
- **Skills dot-pattern decor** moved down + left and made visible/overlapping
  (was jammed in the corner and cut off) — `top:90px; right:4%; width:42%;
  opacity:0.5` at ≤767.
- **Beyond: two clouds on phone** instead of one. They cascade down the right
  edge (the heading is left-aligned and fills the width, so the clear sky is on
  the right): wide cloud top-right by the heading, second cloud lower-right in
  the band below the subtitle.
- **Beyond books: ~3 covers visible** at once (was ~2) — cards 118 → 88px,
  gap 28 → 16px, captions trimmed. (3×88 + 2×16 = 296, fits a 375px viewport.)
- **Nav separators.** Middot (·) dividers between the five menu links; nav gap
  tightened so the effective spacing reads right. Desktop + mobile.
- **Mobile "still polishing" notice.** A small, dismissible cream toast pinned
  to the bottom on phones only, shown once per browser session (sessionStorage):
  "Still polishing the mobile view — this site looks its best on a laptop."
- **Polaroid frame on the hero headshot** (white border + taller foot), added
  as an opt-in `frame="polaroid"` prop on PaperPhoto so it's reusable. Applied
  on both mobile and desktop.

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
  pushed; GitHub Actions built + published. Live at **aman-beniwal.github.io/lab**
  (pixel site still at aman-beniwal.github.io/). Deploy run succeeded (build 24s).
- Made /lab indexable: removed the noindex meta, set a real title
  ("Aman Beniwal — Portfolio") + description, cleaned the footer.
- Working branch is now `main`. Custom domain (e.g. amanbeniwal.com /
  aman.beniwal.online) still open whenever Aman registers one — then add CNAME +
  update astro.config `site`.

### 26 Aug 2026 — GitHub username change

- Aman renamed his GitHub account `AmanBeni` → `aman-beniwal`. Repo renamed
  `AmanBeni.github.io` → `aman-beniwal.github.io`, `astro.config` `site`
  updated to `https://aman-beniwal.github.io`, deployed successfully.
  References to `amanbeni.github.io` elsewhere in this changelog have been
  updated to the new domain to keep links working; the old domain now
  redirects to the new one regardless.

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