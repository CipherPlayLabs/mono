# CipherPlay Context

CipherPlay is an emerging-technology software studio and market research firm. This glossary captures the public-facing business, product, research, partner, investor, and operational language used across this repository.

## Language

### Company

**CipherPlay**:
An emerging-technology software studio and market research firm that connects research, product thesis development, and software execution across AI, cryptographic infrastructure, Spatial Computing, and venture intelligence.
_Avoid_: ABPIV, personal brand, generic software agency, venture-backed as the default company category

**Venture-backed**:
An investor-facing credibility modifier for CipherPlay when the context is diligence, investor confidence, or company validation.
_Avoid_: default company description, generic studio category

**TAP**:
CipherPlay's company-wide philosophy for operating in the game of business: Transparency, Authenticity, and Perspicacity. TAP applies to customers, partners, investors, and internal decisions while also creating investor-facing diligence and trust signals.
_Avoid_: generic values, slogan, opaque game-theory jargon

**Transparency**:
CipherPlay's practice of publishing enough Market Research and product context for customers, partners, and investors to evaluate what CipherPlay sees, builds, and believes. Transparency does not mean publishing gated Market Intelligence, private commercialization material, or private customer information.
_Avoid_: total disclosure, leaking private materials

**Authenticity**:
CipherPlay's practice of making claims that match observable actions, products, and market behavior over time.
_Avoid_: personality branding, vibes, unverifiable claims

**Perspicacity**:
CipherPlay's ability to turn abundant market information into clear, actionable market insight.
_Avoid_: generic intelligence, purely technical judgment

**Perfect information game**:
The game-theory ideal behind TAP: investors, partners, and customers should have enough useful information to understand what CipherPlay sees, what it is building, and why it matters.
_Avoid_: full disclosure, information dump, unexplained jargon

### Products And Services

**RANDAO**:
CipherPlay's current public product at `https://randao.net/`, owned and operated by CipherPlay. RANDAO is a separate product brand focused on decentralized and verifiable randomness for blockchain and cryptographic infrastructure.
_Avoid_: Randao, standalone company, random number app, analytics product

**Product brand**:
A CipherPlay-owned offering that can have its own name, website, audience, and public identity while remaining owned and operated by CipherPlay.
_Avoid_: separate company, unrelated project

**Ownership model**:
CipherPlay can own and operate distinct product brands such as RANDAO, but public copy should keep any holdings-company analogy implicit.
_Avoid_: holding company, Alphabet-like company

**Infrastructure & software consulting**:
CipherPlay's public service name for product-adjacent work that helps customers move from emerging-technology uncertainty into research-backed architecture, prototypes, integrations, or software execution.
_Avoid_: staff augmentation, outsourced development, generic dev-for-hire, Emerging-Technology Execution

**Historic product**:
A sunset product retained as founder history, product history, or technical proof point. Historic products are not current CipherPlay products, active customer offerings, or active roadmap signals.
_Avoid_: active product, abandoned product, roadmap item

### Research And Market Language

**Market Research**:
CipherPlay's publicly accessible emerging-technology market analysis. CipherPlay conducts and publishes extensive Market Research for public audiences.
_Avoid_: blog, investment advice, gated report

**Market Intelligence**:
CipherPlay's more detailed, request-gated research layer for partners, investors, and customers. In public copy, this is reached through Full Report requests.
_Avoid_: public Market Research, blog, investment advice

**Full Report**:
The public-facing term for the deeper Market Intelligence report available behind a public Market Research page.
_Avoid_: Market Intelligence as CTA copy, bigger PDF

**Ready report**:
A Market Research report the owner has approved for publication because it looks clean from a branding perspective and contains useful information based on real market data. Marketing does not need to launch simultaneously, but it should follow quickly.
_Avoid_: draft research, placeholder report, speculative report

**People-Class Report**:
A public State Of Web3 child report focused on one Web3 audience or work category, labeled as one report in the larger aggregate. People-Class Reports can show useful public Market Research while gating the juiciest Market Intelligence behind Full Report CTAs.
_Avoid_: sub report, individual PDF, standalone market category

**Real market data**:
Well-sourced information from deep internet research, real market interviews, and validatable data that CipherPlay can stand behind in public Market Research.
_Avoid_: vibes, unsourced claims, unverifiable assumptions

**Source Thread**:
A Reddit discussion captured as one canonical current customer-discovery source unit, including the thread metadata, post, comments, provider identifiers, and provider-accessible source content. A Source Thread is the source of truth for the Reddit evidence derived from that discussion.
_Avoid_: generic Reddit post, scraped page, raw report

**Thread-Level JTBD Record**:
The customer-discovery analysee for one Source Thread. It summarizes and links the thread-local Evidence Claims for jobs, criteria, contexts, pains, workarounds, solutions, people roles, confidence, and unanswered questions without replacing the underlying evidence rows or making cross-thread claims.
_Avoid_: aggregate report, market conclusion, segment validation

**Thread Extraction Run**:
A per-Source Thread customer-discovery pass that creates or replaces Source Passages, Evidence Claims, and the Thread-Level JTBD Record for that Source Thread. Thread Extraction Runs may update active thread-level evidence directly when the replacement stays scoped to the same Source Thread.
_Avoid_: full-corpus normalization, aggregate rewrite, partial evidence patch

**Evidence Claim**:
An atomic customer-discovery observation grounded in one or more Source Thread passages. Evidence Claims preserve what the source supports before any normalized rollup language is applied, including weak or low-confidence signals when they are clearly labeled.
_Avoid_: insight, theme, normalized job, unlabeled weak signal

**Source Passage**:
An exact passage from a Source Thread used as evidence for customer-discovery analysis. Source Passages keep locator context and the text used at extraction time so Evidence Claims can be traced back precisely.
_Avoid_: loose quote, summary snippet, unsupported citation

**Normalized JTBD Entity**:
A canonical job, criterion, context, pain, workaround, solution, or people role derived from Evidence Claims so related evidence can be compared and rolled up later.
_Avoid_: raw quote, source passage, report bullet

**JTBD Normalization**:
The separate customer-discovery step that turns source-grounded Evidence Claims into Normalized JTBD Entities across threads. JTBD Normalization aligns wording across evidence, aggregates support for related jobs, criteria, contexts, and other JTBD components, and happens after first-pass thread-level extraction.
_Avoid_: first-pass extraction, raw evidence capture

**Normalization Run**:
A complete pass over all active current source-grounded Evidence Claims across all JTBD component categories that rewrites the active Normalized JTBD Entities and their Evidence Relationships. Prior run outputs and stale derived records may remain auditable, but they should not shape the active taxonomy.
_Avoid_: incremental taxonomy patch, one-off merge, silent mutation

**Staged Normalization Run**:
A Normalization Run whose output is written for validation before it becomes the active JTBD Taxonomy. Staging lets operators verify counts, lineage, Evidence Relationships, Evidence Support, and representative outputs before promotion.
_Avoid_: unvalidated rewrite, direct active overwrite

**JTBD Taxonomy**:
The canonical set of Normalized JTBD Entities for one JTBD component type, such as jobs, criteria, contexts, pains, workarounds, solutions, or people roles. Domain slices can be captured as attributes of evidence or entities, but they are not separate taxonomies by default.
_Avoid_: one mixed taxonomy, premature domain-specific taxonomy

**Evidence Support**:
The directional strength behind a Normalized JTBD Entity based on linked Evidence Claims, Source Passages, Source Threads, and relevant Reddit engagement signals such as upvotes. Claim-local engagement and thread-level engagement are separate weighting signals; they can weight support after grouping, but they should not determine canonical JTBD wording or create universal rankings. Evidence Support is not the same as market prevalence, willingness to pay, or validated demand.
_Avoid_: demand proof, prevalence, opportunity score, fixed ranking

**Evidence Relationship**:
The link between an Evidence Claim and a Normalized JTBD Entity. A Normalized JTBD Entity should use same-type Evidence Claims as primary grounding, while related claims from other JTBD component types can provide secondary support; the link itself is the required lineage, not a separate written justification.
_Avoid_: untyped linkage, mixed grounding, evidence dump, rationale essay

**Source Lineage**:
The trace from a Normalized JTBD Entity back through Evidence Claims and Source Passages to the Source Thread that produced them.
_Avoid_: loose citation, undocumented inference

**Stale Derived Record**:
An Evidence Claim, Thread-Level JTBD Record, or Normalized JTBD Entity whose source Source Thread changed after the record was created. Stale Derived Records remain auditable but should not be treated as current customer-discovery evidence until regenerated or reviewed.
_Avoid_: deleted evidence, current finding, silent mismatch

**Spatial Computing**:
The creation of digital 3D worlds and spatial interfaces, including virtual reality, augmented reality, games, and interactive 3D experiences.
_Avoid_: Spacial Computing, VR-only, AR-only

### Audiences And Relationships

**Investor diligence**:
The investor-facing review path for understanding CipherPlay's company model, product anchors, research signals, team, backers, and deeper private materials.
_Avoid_: fundraising page, public investor deck

**Team**:
The public leadership group shown for CipherPlay. For now, the public Team concept means leadership only, not a full contributor or employee roster.
_Avoid_: staff directory, full company roster

**Customer**:
A person or organization evaluating, buying, or using CipherPlay products, services, research access, or technical support. Customer is the canonical public term.
_Avoid_: client, clients

**Partner**:
A person or organization collaborating with CipherPlay around ecosystem access, co-development, distribution, protocol or research alignment, or venture support. Customers are often partners as well, but public language should name the relationship that matters in context.
_Avoid_: vendor, customer list entry

**Partner ecosystem**:
The set of accelerators, ecosystem groups, labs, companies, and technical communities that can collaborate with CipherPlay around research, products, protocols, or market access.
_Avoid_: customer list, vendor directory

**Backer**:
An organization that has provided financial support to CipherPlay. Backing can be dilutive or non-dilutive, but it must be financial support.
_Avoid_: customer, partner ecosystem member, non-financial supporter

**Media Kit**:
The approved public package of CipherPlay brand assets, mainly for partners, customers, and investors who need correct external-use materials.
_Avoid_: design scratchpad, brand system source, press facts page

### Public Operations

**Public content site**:
CipherPlay's current main public site and `/info/` surface for company, research, products and services, partners, media assets, newsroom updates, and team information. This may stop being the main site later if CipherPlay adds a different primary web presence.
_Avoid_: main application, private workspace, permanent only public site

**Public forms**:
The n8n-hosted public request flows for investor materials, partnerships, consulting discovery, and Full Report access. CipherPlay handles forms only through n8n; local `/info/forms/*` routes are placeholders, not production forms.
_Avoid_: local placeholder forms, production request pages, non-n8n form handling

**Report-specific form**:
An n8n-hosted Public form dedicated to access requests for one named Full Report, such as State Of Web3. Report-specific forms should preserve the report context without requiring the requester to restate which report they want.
_Avoid_: generic contact form, local content-site form, untracked report request

**Private analytics**:
CipherPlay's internal-only operational site analytics for measuring public content. Public browser traffic must use same-origin `/_analytics/*` paths, while the Plausible origin and dashboard stay private.
_Avoid_: public analytics dashboard, exposed analytics origin, analytics product
