// @ts-check
// Tailwind v4 primarily configures via CSS `@theme` (see src/styles/global.css),
// but this JS config is kept — and loaded from global.css via `@config` — so the
// full design-system token set lives in one explicit, readable place too, per
// BUILD-SPEC.md §2. If you only ever touch tokens in global.css, this file can
// eventually be deleted; both are wired in for now.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        surface: '#FBFBF8',
        'surface-alt': '#F2F2EE',
        container: '#FFFFFF',
        ink: '#1A1A1A',
        'text-muted': 'rgba(26, 26, 26, 0.6)',
        primary: {
          DEFAULT: '#0056AB',
          container: '#1a6fd1',
        },
        secondary: '#712AE2', // "Agent Purple" — AI/automation tags
        'accent-yellow': '#F2B705', // status / highlights, sparingly
        climate: '#0E7C5A', // "Impact Green" — climate/impact tags + 1-2 CTAs, sparing
        'border-low': 'rgba(26, 26, 26, 0.1)',
        'border-high': '#1A1A1A',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-lg': ['56px', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '800' }],
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['28px', { lineHeight: '1.2', fontWeight: '700' }],
        'headline-sm': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'mono-label': ['13px', { lineHeight: '1.0', letterSpacing: '0.05em', fontWeight: '500' }],
        'mono-data': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        card: '4px',
        button: '8px',
      },
      maxWidth: {
        container: '1200px',
      },
      spacing: {
        gutter: '24px',
        section: '96px',
      },
    },
  },
};
