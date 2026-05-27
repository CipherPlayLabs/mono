# CipherPlay Content And Analytics Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repurpose the existing ABPIV Docusaurus site into CipherPlay's `/info/` content site, preserve same-origin Plausible analytics, and prepare the code for upload into `CipherPlayLabs/mono`.

**Architecture:** The first milestone is local review inside this repo's existing `abpiv-personal-brand/content-site` app. Docusaurus remains the public content system with `baseUrl: "/info/"`; Plausible remains private operational infrastructure under `infra/analytics` with public browser events proxied through `/_analytics/*`. After local approval, copy the content site and analytics infra into the empty private `CipherPlayLabs/mono` repository using root-level `content-site/` and `infra/analytics/`.

**Tech Stack:** Docusaurus 3, React 19, TypeScript, CSS modules, Cloudflare Pages, Cloudflare Workers, Plausible Community Edition, OpenTofu, GCP, GitHub Actions.

---

## Approved Product Decisions

- CipherPlay is a venture-backed emerging-tech software development studio and market research firm.
- The public content site lives under `/info/`.
- The domain root is outside this phase; do not build a root landing page.
- Primary audiences are investors, analysts, partners, and customers.
- Audience routes use plain slugs:
  - `/info/investors`
  - `/info/analysts`
  - `/info/partners`
  - `/info/customers`
- Shared public sections:
  - `/info/market-analysis`
  - `/info/products`
  - `/info/products/randao`
  - `/info/team`
  - `/info/industries`
  - `/info/newsroom`
  - `/info/media-kit`
- The homepage should route audiences quickly while establishing CipherPlay credibility.
- Archive most legacy ABPIV content. Reframe only material that supports CipherPlay credibility, Randao, or market analysis.
- Use the provided `CipherPlay Media Kit/` folder as the brand source of truth.
- Visual system: balanced dark teal CipherPlay brand moments plus readable neutral content surfaces.
- Use the custom `You're Gone` font through logo/media-kit assets only. Include `You're Gone.otf` in public downloads only after redistribution rights are confirmed.
- Randao is the first product and should have a dedicated product page.
- Market analysis uses public teaser pages. Full reports are gated through external forms once those links exist; do not commit full reports publicly.
- Conversion buttons are intended for external forms. Because final form URLs are not available, render CTAs disabled with clear labels.
- Go-to-market details are excluded from public copy in this phase.
- Plausible is operational only. Do not present site analytics as a public product.
- Public browser analytics must remain same-origin through `/_analytics/js/script.js` and `/_analytics/api/event`.
- Future Plausible dashboard/origin domain is not selected yet. Keep it configurable and do not hard-code a public hostname into site HTML or browser-visible JavaScript.

## Source Assets And Public Proof

- Media kit source folder: `/Users/user/Documents/CipherPlay Content Site/CipherPlay Media Kit/`
- Important media kit files:
  - `Logo.svg`
  - `LogoText_V1.svg`
  - `LogoText_V1.png`
  - `Logo_Gradient.svg`
  - `Logo_Gradient.png`
  - `Banner_Website_1200x630.jpg`
  - social banners for YouTube, LinkedIn, Facebook, GitHub, X, Reddit, Telegram/Discord
  - `DesignDetail.txt`
  - `You're Gone.otf`
- Media kit colors from `DesignDetail.txt`:
  - white: `#D9D9D9`
  - gray: `#444444`
  - very dark blue: `#0E6B99`
  - dark blue: `#1EA5B4`
  - light blue: `#37FFDE`
- Team:
  - CEO: Allan B. Pedin IV, `https://www.linkedin.com/in/allan-b-pedin-iv/`
  - CTO: Tyler Warburton, `https://www.linkedin.com/in/tyler-warburton/`
  - COO: Alex Posey
- Team page requires images. Use an approved online/profile image for Tyler. Use a clean generated/template portrait visual for Alex until an approved headshot is supplied.
- Backers:
  - Forward Research
  - VIPC
  - RAMP, the Roanoke-based startup accelerator
- Strategic Connections:
  - Startup Virginia
  - Founder Institute
- Use official/reference pages for logo sourcing and link targets:
  - Forward Research: `https://forward.arweave.net/`
  - VIPC: `https://vipc.org/`
  - RAMP: `https://ramprb.com/`
  - Startup Virginia: `https://www.startupvirginia.org/`
  - Founder Institute: `https://fi.co/`
- Industry pillars:
  - AI Productivity Software
  - Web3 Node Infrastructure
  - Cryptographic Protocols
  - Venture/Market Intelligence
  - AI Research Software

## File Structure

- Modify `content-site/docusaurus.config.ts` for CipherPlay metadata, nav, footer, social image, favicon/logo, and same-origin Plausible settings.
- Modify `content-site/links.ts` to replace ABPIV link constants with CipherPlay/company/product/team links and external CTA destinations.
- Create `content-site/src/data/site.ts` for typed site-wide content:
  - audience pages
  - CTA definitions
  - product cards
  - industry pillars
  - market-analysis teasers
  - media kit assets
  - team members
  - credibility organizations
- Create or replace page files under `content-site/src/pages/`:
  - `index.tsx`
  - `investors.tsx`
  - `analysts.tsx`
  - `partners.tsx`
  - `customers.tsx`
  - `market-analysis.tsx`
  - `products/index.tsx`
  - `products/randao.tsx`
  - `team.tsx`
  - `industries.tsx`
  - `media-kit.tsx`
- Keep or update `content-site/newsroom/` for company announcements.
- Move legacy `content-site/research` and `content-site/insights` content out of primary nav. Keep only CipherPlay-relevant Randao/research material, rewritten as product or market-analysis proof.
- Create reusable components:
  - `content-site/src/components/CipherHero/`
  - `content-site/src/components/AudienceCardGrid/`
  - `content-site/src/components/ConversionButton/`
  - `content-site/src/components/CredibilityStrip/`
  - `content-site/src/components/MediaAssetGrid/`
  - `content-site/src/components/ProductCard/`
  - `content-site/src/components/TeamGrid/`
- Copy approved brand assets into `content-site/static/img/cipherplay/`.
- Put downloadable media-kit files under `content-site/static/media-kit/`.
- Create `content-site/static/media-kit/cipherplay-media-kit.zip` only from assets that are approved for redistribution.
- Keep analytics Worker and infra under `infra/analytics/`; update names/docs to CipherPlay without changing the same-origin proxy contract.

## Task 1: Preserve Current State And Create The Plan Artifact

**Files:**
- Create: `docs/superpowers/plans/2026-05-27-cipherplay-content-analytics-site.md`

- [ ] Confirm the nested repo is clean enough to work in:

```bash
cd "/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand"
git status --short
```

Expected: no tracked changes unless the user has intentionally added files.

- [ ] Review the existing app map:

```bash
cd "/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand"
rg --files content-site infra/analytics | sort
```

Expected: Docusaurus lives in `content-site/`; Plausible infrastructure lives in `infra/analytics/`.

- [ ] Keep this plan file committed separately if the user asks for commits. Commit message:

```bash
git add docs/superpowers/plans/2026-05-27-cipherplay-content-analytics-site.md
git commit -m "docs: plan CipherPlay content site migration"
```

## Task 2: Add CipherPlay Brand Assets

**Files:**
- Create: `content-site/static/img/cipherplay/`
- Create: `content-site/static/media-kit/`
- Modify: `content-site/static/img/social-card.png`

- [ ] Copy brand images from the sibling media kit folder into the Docusaurus static tree:

```bash
cd "/Users/user/Documents/CipherPlay Content Site"
mkdir -p "abpiv-personal-brand/content-site/static/img/cipherplay"
cp "CipherPlay Media Kit/Logo.svg" "abpiv-personal-brand/content-site/static/img/cipherplay/logo.svg"
cp "CipherPlay Media Kit/LogoText_V1.svg" "abpiv-personal-brand/content-site/static/img/cipherplay/logo-text.svg"
cp "CipherPlay Media Kit/Logo_Gradient.svg" "abpiv-personal-brand/content-site/static/img/cipherplay/logo-gradient.svg"
cp "CipherPlay Media Kit/Banner_Website_1200x630.jpg" "abpiv-personal-brand/content-site/static/img/cipherplay/social-card.jpg"
```

Expected: the four files exist under `content-site/static/img/cipherplay/`.

- [ ] Copy public media-kit downloads:

```bash
cd "/Users/user/Documents/CipherPlay Content Site"
mkdir -p "abpiv-personal-brand/content-site/static/media-kit"
cp "CipherPlay Media Kit/Logo.svg" "abpiv-personal-brand/content-site/static/media-kit/Logo.svg"
cp "CipherPlay Media Kit/LogoText_V1.svg" "abpiv-personal-brand/content-site/static/media-kit/LogoText_V1.svg"
cp "CipherPlay Media Kit/Logo_Gradient.svg" "abpiv-personal-brand/content-site/static/media-kit/Logo_Gradient.svg"
cp "CipherPlay Media Kit/Banner_Website_1200x630.jpg" "abpiv-personal-brand/content-site/static/media-kit/Banner_Website_1200x630.jpg"
cp "CipherPlay Media Kit/Banner_LinkedIn(company)_1128x191.jpg" "abpiv-personal-brand/content-site/static/media-kit/Banner_LinkedIn_company_1128x191.jpg"
cp "CipherPlay Media Kit/Banner_X(Twitter)_1500x500.jpg" "abpiv-personal-brand/content-site/static/media-kit/Banner_X_Twitter_1500x500.jpg"
```

Expected: media kit filenames use URL-safe names where possible.

- [ ] Create the ZIP only from approved redistributable assets. Exclude `You're Gone.otf` until redistribution rights are confirmed:

```bash
cd "/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand/content-site/static/media-kit"
zip -r cipherplay-media-kit.zip Logo.svg LogoText_V1.svg Logo_Gradient.svg Banner_Website_1200x630.jpg Banner_LinkedIn_company_1128x191.jpg Banner_X_Twitter_1500x500.jpg
```

Expected: `cipherplay-media-kit.zip` exists and does not include the font file.

## Task 3: Replace Site Metadata, Nav, And Footer

**Files:**
- Modify: `content-site/docusaurus.config.ts`
- Modify: `content-site/links.ts`
- Modify: `content-site/static/_headers`
- Modify: `content-site/static/_redirects` only if local behavior requires it

- [ ] Update `content-site/links.ts` to centralize company links and disabled form destinations:

```ts
export const links = {
  cipherplayLinkedIn: 'https://www.linkedin.com/company/cipherplay',
  allanLinkedIn: 'https://www.linkedin.com/in/allan-b-pedin-iv/',
  tylerLinkedIn: 'https://www.linkedin.com/in/tyler-warburton/',
  randao: 'https://randao.net/',
  randaoWhitepaper: 'https://randao-whitepaper.ar.io/',
  forwardResearch: 'https://forward.arweave.net/',
  vipc: 'https://vipc.org/',
  ramp: 'https://ramprb.com/',
  startupVirginia: 'https://www.startupvirginia.org/',
  founderInstitute: 'https://fi.co/',
  investorForm: '',
  analystForm: '',
  partnerForm: '',
  customerForm: '',
  reportRequestForm: '',
} as const;

export type LinkKey = keyof typeof links;
```

- [ ] Update `content-site/docusaurus.config.ts`:
  - `title: 'CipherPlay'`
  - `favicon: 'img/cipherplay/logo-gradient.svg'`
  - keep `baseUrl: '/info/'`
  - keep `future.v4`
  - keep same-origin Plausible script path and `data-api`
  - use `data-domain` for the current public content-site domain until production domain changes
  - set social image to `img/cipherplay/social-card.jpg`
  - navbar title `CipherPlay`
  - navbar logo `img/cipherplay/logo-gradient.svg`
  - nav items: Investors, Analysts, Partners, Customers, Market Analysis, Products, Media Kit
  - footer items: Audience, Company, Resources, Media Kit, RSS if feeds remain enabled

- [ ] Preserve this analytics injection shape:

```ts
scripts: isProduction
  ? [
      {
        src: '/_analytics/js/script.js',
        defer: true,
        'data-domain': 'allanbpediniv.com',
        'data-api': '/_analytics/api/event',
      },
    ]
  : [],
```

Expected: public analytics requests remain same-origin and do not expose the Plausible dashboard/origin hostname.

## Task 4: Add Central Typed Content Data

**Files:**
- Create: `content-site/src/data/site.ts`

- [ ] Create `content-site/src/data/site.ts` with these exported types:

```ts
export type AudienceSlug = 'investors' | 'analysts' | 'partners' | 'customers';

export interface SiteCta {
  label: string;
  href: string;
  eventName: string;
  disabled: boolean;
}

export interface AudiencePage {
  slug: AudienceSlug;
  navLabel: string;
  eyebrow: string;
  title: string;
  summary: string;
  proofPoints: string[];
  primaryCta: SiteCta;
}

export interface Product {
  slug: string;
  name: string;
  status: string;
  summary: string;
  href: string;
  cta: SiteCta;
}

export interface MediaAsset {
  title: string;
  kind: 'logo' | 'banner' | 'background' | 'package';
  previewSrc: string;
  downloadHref: string;
  format: string;
}

export interface OrganizationProof {
  name: string;
  href: string;
  logoSrc: string;
  relationship: 'backer' | 'strategic-connection';
}
```

- [ ] Populate `audiencePages` with disabled CTAs:

```ts
export const audiencePages: AudiencePage[] = [
  {
    slug: 'investors',
    navLabel: 'Investors',
    eyebrow: 'Capital and company diligence',
    title: 'See how CipherPlay turns emerging-tech theses into software ventures.',
    summary: 'For investors evaluating the team, products, backers, industries, and venture-building focus behind CipherPlay.',
    proofPoints: ['Venture-backed studio model', 'Randao as first product proof', 'Focused emerging-tech industry map'],
    primaryCta: { label: 'Request investor materials', href: '', eventName: 'cta_investor_materials', disabled: true },
  },
  {
    slug: 'analysts',
    navLabel: 'Analysts',
    eyebrow: 'Market research and signal tracking',
    title: 'Read market analysis shaped by builders operating in emerging technology.',
    summary: 'For analysts who want public research previews, industry framing, and a path to request full reports.',
    proofPoints: ['Public report teasers', 'Venture and market intelligence focus', 'Research tied to product-building context'],
    primaryCta: { label: 'Request full research access', href: '', eventName: 'cta_research_access', disabled: true },
  },
  {
    slug: 'partners',
    navLabel: 'Partners',
    eyebrow: 'Ecosystem and venture collaboration',
    title: 'Partner with a studio that can research, prototype, and ship.',
    summary: 'For accelerators, ecosystems, labs, and companies exploring collaboration with CipherPlay.',
    proofPoints: ['Strategic startup ecosystem connections', 'Product and protocol experience', 'Market research plus software execution'],
    primaryCta: { label: 'Propose a partnership', href: '', eventName: 'cta_partner_inquiry', disabled: true },
  },
  {
    slug: 'customers',
    navLabel: 'Customers',
    eyebrow: 'Software and intelligence buyers',
    title: 'Explore emerging-tech software and market intelligence built for real decisions.',
    summary: 'For customers evaluating CipherPlay products, research, or studio-built emerging-tech software.',
    proofPoints: ['Randao product proof', 'AI and cryptographic software focus', 'Research-backed build decisions'],
    primaryCta: { label: 'Start a discovery request', href: '', eventName: 'cta_customer_discovery', disabled: true },
  },
];
```

- [ ] Populate products, industries, media assets, team, backers, and strategic connections in the same file. Use the exact names from this plan.

## Task 5: Build Reusable Page Components

**Files:**
- Create: `content-site/src/components/CipherHero/index.tsx`
- Create: `content-site/src/components/CipherHero/styles.module.css`
- Create: `content-site/src/components/AudienceCardGrid/index.tsx`
- Create: `content-site/src/components/AudienceCardGrid/styles.module.css`
- Create: `content-site/src/components/ConversionButton/index.tsx`
- Create: `content-site/src/components/ConversionButton/styles.module.css`
- Create: `content-site/src/components/CredibilityStrip/index.tsx`
- Create: `content-site/src/components/CredibilityStrip/styles.module.css`
- Create: `content-site/src/components/MediaAssetGrid/index.tsx`
- Create: `content-site/src/components/MediaAssetGrid/styles.module.css`

- [ ] Implement `ConversionButton` so disabled CTAs are visible but non-clickable:

```tsx
import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import type {SiteCta} from '@site/src/data/site';

export function ConversionButton({cta}: {cta: SiteCta}): React.JSX.Element {
  if (cta.disabled || !cta.href) {
    return (
      <button className={styles.button} type="button" disabled data-event-name={cta.eventName}>
        {cta.label}
      </button>
    );
  }

  return (
    <Link className={styles.button} to={cta.href} data-event-name={cta.eventName}>
      {cta.label}
    </Link>
  );
}
```

- [ ] Add CSS that makes disabled CTAs clear without implying a broken page:

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--ifm-color-primary);
  background: var(--ifm-color-primary);
  color: #061114;
  font-weight: 700;
  text-decoration: none;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}
```

- [ ] Build the remaining components as data-driven components that import from `@site/src/data/site`.
- [ ] Avoid card-inside-card layouts. Use full-width bands and simple repeated cards only for actual repeated items.

## Task 6: Rebuild The Homepage

**Files:**
- Modify: `content-site/src/pages/index.tsx`
- Modify: `content-site/src/pages/index.module.css`
- Replace or remove: `content-site/src/components/HomeHero/`
- Replace or remove: `content-site/src/components/SectionCards/`
- Replace or remove: `content-site/src/components/LatestPosts/`

- [ ] Build the `/info/` homepage with:
  - dark CipherPlay hero using `img/cipherplay/social-card.jpg` or logo imagery
  - headline: `CipherPlay`
  - summary: venture-backed emerging-tech software development studio and market research firm
  - audience routing cards for Investors, Analysts, Partners, Customers
  - proof sections for Randao, Market Analysis, Industries, Backers, Strategic Connections
  - no root landing page behavior
- [ ] Remove personal ABPIV hero copy and headshot-led positioning.
- [ ] Ensure all internal links use Docusaurus `Link` with base-url-safe routes such as `/investors`, not `/info/investors`.

## Task 7: Add Audience Pages

**Files:**
- Create: `content-site/src/pages/investors.tsx`
- Create: `content-site/src/pages/analysts.tsx`
- Create: `content-site/src/pages/partners.tsx`
- Create: `content-site/src/pages/customers.tsx`
- Create: `content-site/src/pages/audiencePage.module.css`

- [ ] Each page imports `audiencePages` and renders the matching audience by slug.
- [ ] Each page includes:
  - audience-specific headline and summary
  - proof points
  - relevant links to Products, Randao, Market Analysis, Team, Industries, Media Kit
  - disabled primary CTA via `ConversionButton`
- [ ] Do not publish go-to-market details.
- [ ] Do not claim named organizations have endorsed CipherPlay unless the copy is limited to the approved relationship labels in this plan.

## Task 8: Add Products And Randao Pages

**Files:**
- Create: `content-site/src/pages/products/index.tsx`
- Create: `content-site/src/pages/products/randao.tsx`
- Create: `content-site/src/pages/products/products.module.css`
- Modify or archive: `content-site/research/2026-04-30-randao-white-paper-v1.mdx`

- [ ] Products index shows Randao as the first product and leaves space for future products without empty public slots.
- [ ] Randao page includes:
  - product status
  - product thesis
  - links to `https://randao.net/`
  - link to whitepaper `https://randao-whitepaper.ar.io/`
  - relevant featured media from current `content-site/src/data/featured.ts`
  - disabled product inquiry CTA
- [ ] Reframe the existing Randao whitepaper stub as product proof or route users to the new Randao product page.

## Task 9: Add Market Analysis And Industries Pages

**Files:**
- Create: `content-site/src/pages/market-analysis.tsx`
- Create: `content-site/src/pages/industries.tsx`
- Create: `content-site/src/pages/market-analysis.module.css`
- Create: `content-site/src/pages/industries.module.css`

- [ ] Market Analysis page shows public teaser cards only:
  - title
  - executive summary
  - industries/tags
  - disabled request-full-report CTA
- [ ] Do not commit full private report files.
- [ ] Industries page presents the five approved pillars:
  - AI Productivity Software
  - Web3 Node Infrastructure
  - Cryptographic Protocols
  - Venture/Market Intelligence
  - AI Research Software
- [ ] Tie each pillar to audience needs and product/research proof where possible.

## Task 10: Add Team, Backers, Strategic Connections, And Media Kit

**Files:**
- Create: `content-site/src/pages/team.tsx`
- Create: `content-site/src/pages/media-kit.tsx`
- Create: `content-site/src/pages/team.module.css`
- Create: `content-site/src/pages/media-kit.module.css`
- Create: `content-site/static/img/team/`
- Create: `content-site/static/img/organizations/`

- [ ] Team page shows leadership only:
  - Allan B. Pedin IV, CEO
  - Tyler Warburton, CTO
  - Alex Posey, COO
- [ ] Use Allan's existing local headshot if approved by the user. Otherwise replace it with a CipherPlay-approved image.
- [ ] Add Tyler's image from an approved public/profile source.
- [ ] Use a clean template portrait asset for Alex.
- [ ] Backers section includes Forward Research, VIPC, and RAMP.
- [ ] Strategic Connections section includes Startup Virginia and Founder Institute.
- [ ] Media Kit page shows:
  - logo previews
  - brand colors
  - social/banner previews
  - individual downloads
  - `cipherplay-media-kit.zip` download
  - note that the display font is available only when redistribution rights are confirmed

## Task 11: Update Analytics Event Tracking

**Files:**
- Create: `content-site/src/components/TrackedLink/index.tsx`
- Create: `content-site/src/components/TrackedLink/styles.module.css`
- Modify: pages/components that render audience routing, CTAs, products, market-analysis links, and media-kit downloads

- [ ] Implement `TrackedLink` using the existing global Plausible queue:

```tsx
import React from 'react';
import Link from '@docusaurus/Link';

declare global {
  interface Window {
    plausible?: (eventName: string, options?: {props?: Record<string, string>}) => void;
  }
}

interface TrackedLinkProps {
  to: string;
  eventName: string;
  eventProps?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}

export function TrackedLink({to, eventName, eventProps, className, children}: TrackedLinkProps): React.JSX.Element {
  return (
    <Link
      to={to}
      className={className}
      onClick={() => window.plausible?.(eventName, {props: eventProps})}
    >
      {children}
    </Link>
  );
}
```

- [ ] Track these core events:
  - `route_audience_segment`
  - `cta_investor_materials`
  - `cta_research_access`
  - `cta_partner_inquiry`
  - `cta_customer_discovery`
  - `product_randao_outbound`
  - `market_analysis_teaser_click`
  - `media_kit_download`
- [ ] Keep disabled CTA buttons non-clickable. They may carry `data-event-name` for future verification, but they should not emit events until enabled.

## Task 12: Preserve And Rebrand Analytics Infrastructure

**Files:**
- Modify: `infra/analytics/README.md`
- Modify: `infra/analytics/opentofu/variables.tf`
- Modify: `infra/analytics/opentofu/locals.tf`
- Modify: `infra/analytics/worker/src/index.ts` only if naming or allowed routes need cleanup
- Modify: `.github/workflows/deploy.yml` only after local approval

- [ ] Replace ABPIV-specific documentation with CipherPlay wording while preserving the same-origin architecture.
- [ ] Keep Worker routes limited to:
  - `/_analytics/js/script.js`
  - `/_analytics/api/event`
- [ ] Keep `PLAUSIBLE_ORIGIN_HOSTNAME` as an environment binding.
- [ ] Do not hard-code the future Plausible dashboard/origin hostname in public site source.
- [ ] Keep local verification commands:

```bash
cd "/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand/infra/analytics/worker"
npm ci
npm run typecheck
npm run build
npm test
```

Expected: typecheck, build, and tests pass.

## Task 13: Local Verification And Review Server

**Files:**
- No new files unless Docusaurus build output is generated and ignored.

- [ ] Install and validate the content site:

```bash
cd "/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand/content-site"
npm ci
npm run typecheck
npm run build
```

Expected: typecheck passes and Docusaurus build completes. Existing Docusaurus warnings are acceptable only if they are unrelated to changed routes/content.

- [ ] Confirm public build output does not expose a Plausible dashboard/origin domain:

```bash
cd "/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand/content-site"
rg -n "analytics\\.lobst3rs\\.com|lobst3rs|PLAUSIBLE_ORIGIN_HOSTNAME" build || true
```

Expected: no public build matches for the private analytics origin.

- [ ] Start local review server:

```bash
cd "/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand/content-site"
npm run start -- --host 127.0.0.1
```

Expected: Docusaurus prints a local URL. Share the URL with the user for review.

## Task 14: Prepare Monorepo Upload After Local Approval

**Files:**
- Target repo: `CipherPlayLabs/mono`
- Target layout:
  - `content-site/`
  - `infra/analytics/`
  - `.github/workflows/` after local approval

- [ ] Confirm the target repo is empty or ready:

```bash
gh api repos/CipherPlayLabs/mono
gh api repos/CipherPlayLabs/mono/contents || true
```

Expected: repository exists and may have no contents.

- [ ] Clone or use an existing checkout:

```bash
cd "/Users/user/Documents/CipherPlay Content Site"
git clone https://github.com/CipherPlayLabs/mono.git cipherplay-mono
```

Expected: `cipherplay-mono/` exists.

- [ ] Copy approved local source into the monorepo:

```bash
cd "/Users/user/Documents/CipherPlay Content Site"
rsync -a --delete --exclude node_modules --exclude build --exclude cloudflare-pages abpiv-personal-brand/content-site/ cipherplay-mono/content-site/
rsync -a --delete abpiv-personal-brand/infra/analytics/ cipherplay-mono/infra/analytics/
```

Expected: monorepo has root-level `content-site/` and `infra/analytics/`.

- [ ] Do not add a root landing page in this phase.
- [ ] Add CI/CD only after the user approves the local site direction.

## Final Verification Checklist

- [ ] `/info/` homepage says CipherPlay and routes to all four audience pages.
- [ ] `/info/investors`, `/info/analysts`, `/info/partners`, and `/info/customers` exist.
- [ ] `/info/media-kit` previews and downloads approved assets.
- [ ] `/info/products/randao` exists and links to Randao and the whitepaper.
- [ ] `/info/team` shows only CEO, CTO, and COO.
- [ ] Backers and Strategic Connections are separated.
- [ ] Public copy does not imply Startup Virginia or Founder Institute are backers.
- [ ] Public copy does not publish go-to-market details.
- [ ] Public copy does not offer full private reports.
- [ ] Disabled CTAs are clear and intentional.
- [ ] Docusaurus build passes.
- [ ] Worker tests pass if analytics infra changes are made.
- [ ] Public build output does not expose the Plausible dashboard/origin hostname.

## Prompt For The Next AI

```text
You are implementing the CipherPlay content and analytics site plan.

Workspace:
/Users/user/Documents/CipherPlay Content Site

Primary local repo:
/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand

Plan to follow:
/Users/user/Documents/CipherPlay Content Site/abpiv-personal-brand/docs/superpowers/plans/2026-05-27-cipherplay-content-analytics-site.md

Use superpowers:subagent-driven-development or superpowers:executing-plans. Work task by task from the plan. First milestone is local implementation and review inside abpiv-personal-brand/content-site. Do not upload to CipherPlayLabs/mono or add CI/CD until the user approves the local site direction.

Important constraints:
- Keep Docusaurus baseUrl as /info/.
- Do not build a root landing page.
- Use the provided CipherPlay Media Kit as brand source of truth.
- Keep Plausible operational/private only.
- Public analytics requests must remain same-origin through /_analytics/*.
- Do not expose the Plausible dashboard/origin hostname in public HTML or JS.
- Render conversion CTAs disabled because external form URLs are not ready.
- Do not publish go-to-market details.
- Do not commit full private research reports.
- Separate Backers from Strategic Connections.

Start by reading the plan, inspecting the current Docusaurus config, then implement Task 2 onward. Run local typecheck/build and start the local Docusaurus server for review.
```
