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

- There will be only two fonts in the whole website. One is the hiding one which is fine currently, it's good. Rest all the fonts move to one single font style. Give me 3 option sto choose from. The typewriter type font that is there currently is rejected. Dont like that.
- Replace the hero image by - "hero support original". reduce the size by 20%
- Add shadow to the photos. It should look like the light source is at the top left in all the photos always. i don't want simple bullshit shadow. I want something that would look genuine and good. Keep in mind it's just a photo on top of a paper, so not too much height. Research on internet or maybe get UI UX ideas before like executing it. 
- Add a tape on top of the photos, to make them stick to the board background. Tape in the folder - Reference -> Tape. Mix them and use randomly from the 6 options. Automatically add it from the next time a image is added in to the website. Use single tape for small image and two tapes on top sides for large images. Also 1-2 tapes are also very long so evaluate which one to use. 
- Move Aman Image in the hero section a bit below.
- Add this effect to the buttons on the top - https://framer.com/m/Paper-ayJyDp.js@v1aoTcHCkdkuXc6dy295. Link - https://www.framer.com/community/marketplace/components/paper-button/

### 19 Aug 2026
- Moved nav to a sticky top bar, meli-style.
- Single page background, section dividers instead of coloured sections.
- Body font set to Euclid Circular B.

### 19 Aug 2026 (execution round)
- Page ground switched to flat cream (`#F3F2E9`), texture and grain off by default.
- Added the missing hairline frame around all four edges of the page.
- Hero panel height cut by 30%.
- Hero photo moved below the text instead of beside it.
- Removed every rotation (photos, tape, objects) — nothing tilted any more.
- Removed every drop shadow across the page.
- All section headings switched to sentence case.
- Restored the missing "A bit about me" heading in About.
- Restored the green textured ground on Contact so it bookends the page.
- Increased body copy size (~17-18px) and scaled smaller text up with it.
- Diorama moved to the right of the hero (it was rendering outside the layout row).
- Removed the stray olive tape strip under the hero photo.
- Cut the yellow background out of the diorama so it sits on the green.
