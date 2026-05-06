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
/                   → Home (hero + tagline + latest book + CTA)
/about              → Bio, photo, influences
/books              → Grid of published works (cover, blurb, buy links)
/books/[slug]       → Individual book page (synopsis, reviews, purchase)
/blog               → Article listing (paginated)
/blog/[slug]        → Single post
/events             → (future) Signings, readings
/contact            → Contact form or social links
/newsletter         → Signup page (also embedded in footer)
```

## Page Breakdown

### Home `/`
- Full-width hero: atmospheric dieselpunk illustration or moody photo
- Tagline / one-liner
- Featured book card with cover + "Read more" CTA
- Latest 2–3 blog posts
- Newsletter CTA strip

### About `/about`
- Author photo (styled frame with art-deco border)
- Short bio (2–3 paragraphs)
- Influences / "What I write" section
- Social media links

### Books `/books`
- Responsive grid of book covers
- Each card: cover image, title, genre tag, one-line hook
- Click → individual book page

### Book Detail `/books/[slug]`
- Large cover image
- Full synopsis
- Pull-quotes / reviews
- Buy links (Amazon, Bookshop, Kindle, etc.)
- "Also by this author" carousel

### Blog `/blog`
- Card-based listing (title, date, excerpt, reading time)
- Category/tag filter
- Pagination

### Newsletter
- Embedded signup form (name + email)
- Incentive copy ("Get a free short story…")
- Integrated into footer site-wide

### Contact `/contact`
- Simple form (name, email, message) or mailto link
- Social icons (Twitter/X, Instagram, Goodreads, etc.)

## Content Structure (Astro)

```
src/
├── content/
│   ├── books/          # Markdown per book
│   │   ├── book-one.md
│   │   └── book-two.md
│   └── blog/           # Markdown per post
│       ├── first-post.md
│       └── second-post.md
├── layouts/
│   ├── BaseLayout.astro
│   ├── BookLayout.astro
│   └── BlogPostLayout.astro
├── pages/
│   ├── index.astro
│   ├── about.astro
│   ├── books/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── blog/
│   │   ├── index.astro
│   │   └── [slug].astro
│   ├── contact.astro
│   └── newsletter.astro
├── components/
│   ├── Header.astro
│   ├── Footer.astro
│   ├── BookCard.astro
│   ├── BlogCard.astro
│   ├── NewsletterForm.astro
│   └── HeroSection.astro
└── styles/
    └── global.css       # Tailwind + custom dieselpunk tokens
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

1. [ ] Initialize Astro project (`npm create astro@latest`)
2. [ ] Install Tailwind CSS integration
3. [ ] Set up base layout with header/footer
4. [ ] Build Home page
5. [ ] Create content collections for books & blog
6. [ ] Build Books grid + detail pages
7. [ ] Build Blog listing + post pages
8. [ ] Add newsletter form
9. [ ] Add contact page
10. [ ] Style with dieselpunk theme
11. [ ] Deploy to Netlify/Vercel
