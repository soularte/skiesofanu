# Skies of Anu — Author Site Plan

## Overview
A novelist portfolio & blog site with a **minimal, clean, romantic dieselpunk** aesthetic.

## Recommended Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | **Astro** | Static-first, fast, markdown blog built-in, minimal JS shipped |
| Styling | **Tailwind CSS** | Rapid custom theming, easy dieselpunk palette |
| Content | **Astro Content Collections** (Markdown/MDX) | Write books & blog posts in Markdown, no CMS needed |
| Newsletter | **Buttondown** or **ConvertKit** embed | Simple form, no backend |
| Hosting | **Netlify** or **Vercel** | Free tier, auto-deploy from Git |
| Shop links | External (Amazon, Bookshop.org, etc.) | No payment processing needed |

## Design Direction

**Romantic Dieselpunk — Minimal & Clean**
- Muted sepia / warm grays / brass gold accent (`#C9A84C`)
- Subtle art-deco geometric borders & dividers
- Serif heading font (e.g. *Playfair Display*) + clean sans body (e.g. *Inter*)
- Vintage paper texture as optional background
- Minimal animation: soft fade-ins, parallax on hero
- Dark mode: deep charcoal (`#1A1A2E`) with gold highlights

## Site Map

```
/                   → Home (hero + news + books gallery + litportals + blog + telegram)
/about              → Bio, photos, influences, litportals
/about/[slug]       → Individual author page (from content collection)
/books              → Alternating-layout list of all books/series
/books/[slug]       → Book/series detail (synopsis, reviews, characters, lore, trailer)
/books/[slug]/lore/[loreSlug] → Lore article tied to a book
/blog               → Blog listing with tag filter
/blog/[slug]        → Single blog post
/404                → Not found page
```

## Page Breakdown

### Home `/`
- Full-width hero with author photos and tagline
- News banner with progress indicators
- Books gallery (horizontal scroll with covers)
- Literary platforms block (decorated box)
- Latest 3 blog posts
- Telegram widget

### About `/about`
- Author portraits with bios
- Influences section
- Literary platforms

### Books `/books`
- Alternating left/right layout per book
- Cover + description + marketplace links

### Book Detail `/books/[slug]`
- Hero: cover + genres + logline + description
- Reviews section
- Series info (reading order, series description)
- Booktrailer (video)
- Books in series gallery
- Characters gallery
- World section
- Lore articles

### Blog `/blog`
- Card grid with tag filter
- Cover images + excerpts

### Lore `/books/[slug]/lore/[loreSlug]`
- Article with cover, breadcrumb, prev/next navigation

## Content Structure (Astro)

```
src/
├── content/
│   ├── books/          # Markdown per book/series
│   ├── blog/           # Markdown per blog post
│   ├── lore/           # Markdown per lore article
│   └── authors/        # Markdown per author
├── data/               # YAML data files (gray-matter)
│   ├── site.md
│   ├── authors.md
│   ├── links.md
│   ├── news.md
│   └── telegram.md
├── layouts/
│   └── BaseLayout.astro
├── lib/
│   ├── data.ts         # gray-matter loaders
│   ├── images.ts       # findImage() utility
│   ├── slider.ts       # shared gallery slider logic
│   └── types.ts        # TypeScript interfaces
├── pages/
│   ├── index.astro
│   ├── 404.astro
│   ├── about/
│   ├── blog/
│   └── books/
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── Icon.astro
│   ├── CoversGallery.astro
│   ├── CardsGallery.astro
│   ├── CharactersGallery.astro
│   ├── Lightbox.astro
│   ├── LitPortals.astro
│   ├── SocialBar.astro
│   ├── MarketplaceLinks.astro
│   ├── Divider.astro
│   ├── DecoratedBox.astro
│   └── book/           # Book-page sub-components
└── styles/
    └── prose.css       # Unified markdown content styles
```

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#FAF6F0` | Page background (light parchment) |
| `--bg-dark` | `#1A1A2E` | Dark mode background |
| `--text-primary` | `#2C2C2C` | Body text |
| `--accent-gold` | `#C9A84C` | Links, borders, highlights |
| `--accent-copper` | `#B87333` | Secondary accent |
| `--muted` | `#8B8680` | Captions, metadata |

## Typography

- **Headings:** Playfair Display (serif, elegant)
- **Body:** Inter or Source Sans Pro (clean readability)
- **Accent/Quotes:** Libre Baskerville (italic, literary feel)

## Next Steps

All core pages implemented. Remaining work:
- [ ] Replace placeholder images/SVGs with real assets
- [ ] Configure real domain in `astro.config.mjs` and `robots.txt`
- [ ] Set up Yandex Metrika ID in `src/data/site.md`
- [ ] Deploy to Netlify (config in `netlify.toml`)
- [ ] Add real blog/lore content
