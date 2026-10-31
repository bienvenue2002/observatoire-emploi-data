# Typography

The search interface and French resources use Source Sans 3, with system sans-serif fallbacks for characters not present in the font. The existing IBM Plex Mono accent remains in dates and numerical metadata.

## Font files

- **Source Sans 3:** variable upright font from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/sourcesans3), converted from TTF to WOFF2 without changing the outlines or family name.
- **Licence:** SIL Open Font License 1.1, included at `site/fonts/SourceSans3-OFL.txt`; the original text is available in the [Google Fonts repository](https://raw.githubusercontent.com/google/fonts/main/ofl/sourcesans3/OFL.txt).
- **Hosting:** `site/fonts/source-sans-3-variable.woff2` is served with the site and preloaded by both HTML pages, with `font-display: swap`.

## Size scale

- **Secondary text:** 14–15 px at a default 16 px browser root size.
- **Controls and supporting copy:** 16–17 px.
- **Main text and offer titles:** 17–18 px.
- **Section headings:** 20–24 px; the main page title uses a responsive 28–36 px range.

These sizes use `rem` and fluid CSS rather than disabling browser zoom. The browser suite checks both pages at desktop, tablet and narrow mobile widths, and tests 200% root-font scaling.
