// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

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
  // User-site deploy: https://amanbeni.github.io (repo: AmanBeni.github.io).
  // base stays '/' so all absolute asset paths (/fonts, /decor, …) resolve.
  site: 'https://amanbeni.github.io',
  base: '/',
  vite: {
    plugins: [tailwindcss()],
  },
});
