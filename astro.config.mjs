// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import labDevServer from './plugins/lab-dev-server.mjs';

// https://astro.build/config
//
// GitHub Pages config:
// - If deploying to <username>.github.io (a "user/org site" repo), set base to '/'.
// - If deploying to <username>.github.io/<repo-name> (a "project site" repo, the
//   common case), set base to '/<repo-name>/' and site to the full Pages URL.
// - If/when a custom domain is attached (via a CNAME file in public/ + DNS),
//   set base back to '/' and site to 'https://your-custom-domain.com'.
//
// TODO: replace REPLACE_ME_GH_USERNAME and REPLACE_ME_REPO_NAME below with the
// real GitHub username and repo name once the repo exists (or update site/base
// to your custom domain — see comment above).
export default defineConfig({
  // User-site deploy: https://aman-beniwal.github.io (repo: aman-beniwal.github.io).
  // base stays '/' so all absolute asset paths (/fonts, /decor, …) resolve.
  site: 'https://aman-beniwal.github.io',
  base: '/',
  // 2 Sep 2026: the paper site moved from /lab to / (and the old pixel site to
  // /old). Keep /lab working so links shared while it lived there still land on
  // the homepage — Astro emits a static redirect page, fine for GitHub Pages.
  redirects: {
    '/lab': '/',
  },
  vite: {
    plugins: [tailwindcss(), labDevServer()],
  },
});
