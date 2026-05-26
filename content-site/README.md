# Personal Brand Content Site - Documentation

## Overview

This is a Docusaurus v3 (TypeScript) personal brand site located in `content-site/`. It serves as a hub for showcasing work across multiple content sections.

---

## Architecture

### Routes & Plugins

| Route       | Plugin                                             | Notes                                          |
| ----------- | -------------------------------------------------- | ---------------------------------------------- |
| `/research` | `@docusaurus/plugin-content-blog` (id: `research`) | Long-form research, RSS at `/research/rss.xml` |
| `/insights` | `@docusaurus/plugin-content-blog` (id: `default`)  | Blog-style posts, RSS at `/insights/rss.xml`   |
| `/newsroom` | `@docusaurus/plugin-content-blog` (id: `newsroom`) | Announcements, RSS at `/newsroom/rss.xml`      |
| `/featured` | Custom React page `src/pages/featured/index.tsx`   | Showcase of appearances                        |
| `/about`    | MDX page `src/pages/about.mdx`                     | Bio page                                       |
| `/`         | Custom `src/pages/index.tsx`                       | Homepage with Hero, SectionCards, LatestPosts  |

### Key Files

- **`docusaurus.config.ts`** - Main configuration. All social links are imported from `links.ts`. Footer displays navigation + RSS links only. Social icons are rendered via swizzled Footer component.
- **`links.ts`** - Single source of truth for all social/website URLs. Contains: github, linkedin, x, facebook, instagram, youtube, hackernoon, hackernews, crunchbase, f6s, strava, tiktok, email
- **`src/theme/Footer/index.tsx`** - Ejected and customized Footer. Replaces standard footer links with a centered row of social icons using FontAwesome. Uses `@fortawesome/react-fontawesome` package.
- **`src/css/custom.css`** - Dark theme with electric blue (`#00AAFF`) primary color. Dark-only mode (no theme switching).

---

## Custom Components

### `src/components/`
- **HomeHero** - Hero section on homepage with name "Allan B. Pedin IV" and tagline: `CEO | Redefining the Internet to be: Intelligent • Transparent • Inclusive • Decentralized | CEO & Co-Founder at CipherPlay & randao.net | Published AI & Blockchain Researcher`
- **SectionCards** - Four section cards for Research, Featured, Insights, Newsroom
- **LatestPosts** - Shows recent posts from all three blog instances
- **FeaturedFilters** - Tag multi-select + search bar for featured page
- **FeaturedCard** - Card component for featured items

### `src/data/`
- **featured.ts** - Featured items array with YouTube videos. Uses `hqdefault.jpg` thumbnails from YouTube image service. Each item has: title, outlet, description, preview (image URL), website (link), tags, date
- **featuredTags.ts** - Tag definitions: podcast, interview, article, guest-post, talk, keynote, video, panel, newsletter, book, favorite

---

## Content Sections

### Research (`research/` directory)
- Blog-style posts for published research
- Currently contains 3 published papers:
  1. "Secure and Decentralized Anonymous E-Voting Scheme" - ACM 2023, CNU
  2. "Smart Contract-Based Social Recovery Wallet Management Scheme" - ACM 2023, CNU
  3. "Predicting Road Quality Using High Resolution Satellite Imagery" - PLOS ONE 2021, William & Mary (under Ethan Brewer)

### Insights (`insights/` directory)
- General blog posts
- Currently has 1 seed post

### Newsroom (`newsroom/` directory)
- Announcements and milestones
- Currently has 1 seed post

---

## Author System

All three blog directories (`research/`, `insights/`, `newsroom/`) each have an `authors.yml` file that defines the `allan` author:
```yaml
allan:
  name: "Allan B. Pedin IV"
  title: "Software Engineer & Developer"
  url: "https://abpiv.dev"
  image_url: "/img/headshot.png"
  socials:
    github: "BrewDogDev"
    x: "allanpedin"
    linkedin: "allanpedin"
```

All blog posts frontmatter should use `author: allan`.

---

## Deployment

- **baseUrl**: `/info/`
- **url**: `https://allanbpediniv.com`
- GitHub Actions workflow in `.github/workflows/deploy.yml` deploys to Cloudflare Pages on push to `main`
- Cloudflare Pages project: `abpiv-personal-brand`
- See [`AI_HANDOFF.md`](./AI_HANDOFF.md) for the current deployment architecture, packaging details, credentials, and verification commands.

---

## Build Commands

```bash
cd content-site
npm start        # Development server
npm run build    # Production build
npm run serve    # Serve built site
npm run clear    # Clear cache
```

---

## Known Issues / Notes

- Footer RSS links generate `onBrokenLinks` warnings - these are harmless, the RSS files are generated but Docusaurus SSG checker doesn't recognize them as static files
- `blogDir` warning refers to old default path - harmless
- Dark-only theme enforced via `colorMode.disableSwitch: true`
- Social icons in footer use `@fortawesome/react-fontawesome` (brands + solid packages installed)

---

## Adding Content

### New Featured Item
Add to `src/data/featured.ts`:
```typescript
{
  title: 'Video Title',
  outlet: 'Channel Name',
  description: 'Brief description.',
  preview: 'https://i.ytimg.com/vi/[VIDEO_ID]/hqdefault.jpg',
  website: 'https://youtube.com/watch?v=[VIDEO_ID]',
  tags: ['podcast', 'video'],
  date: '2025-MM-DD',
}
```

### New Research Post
Create new file in `research/` directory with frontmatter:
```yaml
---
slug: url-friendly-slug
title: "Post Title"
author: allan
tags: [research]
date: 2025-MM-DD
description: "Brief description for SEO"
---
```

### Update Social Links
Edit `links.ts` - changes automatically propagate to footer icons and navbar.

---

## Theme Customization

- **Primary color**: Electric blue `#00AAFF` (light mode: `#0066FF`)
- **Background**: Dark `#0d1117`
- **Surface**: `#161b22`
- **Font**: system-ui

All changes made in `src/css/custom.css`
