# CipherPlay Handoff

## Goal

Document everything currently known about CipherPlay inside `mono`, then align the content site with that canonical brand and operating context.

The main source of truth created for this work is `CONTEXT.md` at the `mono` root. It should be used before changing CipherPlay copy, routes, product language, research language, partner/customer wording, investor wording, forms, analytics, or media-kit language.

## Current Progress

- Created `CONTEXT.md` with CipherPlay's canonical glossary and business context.
- Defined CipherPlay as an emerging-technology software studio and market research firm.
- Clarified that "venture-backed" is useful for investor credibility, not the default company category.
- Captured TAP as CipherPlay's company-wide philosophy for operating in the game of business: Transparency, Authenticity, and Perspicacity.
- Clarified that TAP applies to customers, partners, investors, and internal decisions; investor pages can emphasize trust and diligence signals.
- Established "Customer" as the canonical public term. Avoid "client" and "clients" in public copy.
- Clarified that customers are often partners too, but copy should name whichever relationship matters in context.
- Defined "Backer" as financial support only, including dilutive or non-dilutive support.
- Clarified public research language:
  - "Market Research" is the publicly accessible research layer.
  - "Market Intelligence" is the more detailed, gated layer.
  - "Full Report" is the best public CTA for the deeper gated report.
- Defined a ready report as owner-approved, brand clean, useful, based on real market data, and followed quickly by marketing.
- Defined real market data as well-sourced information from deep internet research, real market interviews, and validatable data.
- Documented RANDAO as a CipherPlay product at `https://randao.net/`, owned and operated by CipherPlay.
- Kept the "CipherPlay is to RANDAO what Alphabet is to Google" idea implicit rather than using that analogy publicly.
- Clarified that the media kit is mainly for partners, customers, and investors who need brand assets.
- Clarified that this content site is the current main public site, though that may change later.
- Documented that all public forms must be handled through n8n. Local `/info/forms/*` routes are placeholders only.
- Documented that Plausible analytics details are private/internal only.

Content-site changes already made:

- Updated copy across the Docusaurus site to match the new company positioning.
- Corrected RANDAO casing and ownership language.
- Removed the made-up "pillars" framing.
- Removed `/industries` from the site and navigation.
- Removed fake or not-ready public Market Research report pages.
- Simplified `/info/market-analysis` into a holding page for future approved reports, with no fabricated report listings.
- Removed report category/tag chips and related unused report data structures.
- Updated `content-site/AI_HANDOFF.md` and `content-site/README.md` to match the active route surface.

Important files touched during this work:

- `CONTEXT.md`
- `content-site/AI_HANDOFF.md`
- `content-site/README.md`
- `content-site/docusaurus.config.ts`
- `content-site/src/data/media.ts`
- `content-site/src/data/site.ts`
- `content-site/src/pages/about.tsx`
- `content-site/src/pages/about/tap-into-success.tsx`
- `content-site/src/pages/forms/consulting-discovery.tsx`
- `content-site/src/pages/index.tsx`
- `content-site/src/pages/index.module.css`
- `content-site/src/pages/market-analysis.tsx`
- `content-site/src/pages/market-analysis.module.css`
- `content-site/src/pages/media-kit.tsx`
- `content-site/src/pages/partners.tsx`
- `content-site/src/pages/products/index.tsx`
- `content-site/src/pages/products/randao.tsx`
- `content-site/src/pages/team.tsx`

Deleted as part of the cleanup:

- `content-site/src/pages/industries.tsx`
- `content-site/src/pages/industries.module.css`
- `content-site/src/components/MarketResearchReportPage/index.tsx`
- `content-site/src/components/MarketResearchReportPage/styles.module.css`
- `content-site/src/pages/market-analysis/ai-productivity-software.tsx`
- `content-site/src/pages/market-analysis/cryptographic-infrastructure.tsx`
- `content-site/src/pages/market-analysis/venture-market-intelligence.tsx`

There are unrelated or pre-existing dirty worktree changes in the repo. Do not revert them unless the user explicitly asks. Check `git status --short` before making further edits.

## What Worked

- The `grill-me` skill worked well for collecting and resolving brand language one term at a time.
- Updating `CONTEXT.md` as decisions were made kept the brand system coherent.
- Removing not-ready reports entirely was cleaner than leaving placeholders that looked like real public research.
- Public copy is strongest when it uses "Market Research" for the visible layer and "Full Report" for the gated deeper layer.
- RANDAO language should be direct: it is a product owned and operated by CipherPlay.
- Verification worked with the bundled Node runtime because `npm` was not available on the shell PATH.

Successful verification commands from `mono/content-site`:

```bash
/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/typescript/bin/tsc
/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/@docusaurus/core/bin/docusaurus.mjs build
test -e build/market-analysis.html
test ! -d build/market-analysis
test ! -e build/market-analysis/ai-productivity-software.html
test ! -e build/market-analysis/cryptographic-infrastructure.html
test ! -e build/market-analysis/venture-market-intelligence.html
```

The Docusaurus build exited successfully. It printed a non-fatal update-check warning about `/Users/user/.config`.

## What Didn't Work

- `npm` is not available on PATH in the current shell, so use the bundled Node runtime directly.
- Do not describe CipherPlay as a generic software agency, ABPIV, or personal brand.
- Do not use "client" or "clients" publicly; use "customers."
- Do not use "Backer" for non-financial ecosystem support.
- Do not present not-ready reports as public Market Research.
- Do not recreate `/industries` or the old industry pillar framing without a real owner-approved reason.
- Do not expose Plausible origin/dashboard details publicly.
- Do not build production public forms locally; forms are n8n only.

## Next Steps

1. Review `CONTEXT.md` before any further copy or route changes.
2. When the user adds real reports, create report pages only after they say each report is ready.
3. For each future report, ensure the page has clean branding, useful real market data, and a clear "Full Report" request CTA.
4. Keep deeper Market Intelligence gated behind request flows, not fully public pages.
5. Re-run typecheck and build after any content-site changes using the bundled Node commands above.
6. Check old removed routes after build so `/industries` and deleted report pages stay absent.
7. Preserve existing dirty worktree changes that are unrelated to the current task.
