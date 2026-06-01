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
