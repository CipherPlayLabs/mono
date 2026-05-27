import {links} from '../../links';

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
  href?: string;
  linkLabel?: string;
  cta?: SiteCta;
}

export interface ServiceOffering {
  slug: string;
  name: string;
  status: string;
  summary: string;
  capabilities: string[];
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
  logoSrc?: string;
  relationship: 'backer' | 'partner-ecosystem';
}

export interface IndustryPillar {
  name: string;
  summary: string;
  audienceFit: string;
  proofHref: string;
}

export interface ReportSection {
  title: string;
  body: string;
}

export interface ReportFaq {
  question: string;
  answer: string;
}

export interface MarketResearchReport {
  slug: string;
  title: string;
  eyebrow: string;
  reportCode: string;
  executiveSummary: string;
  industries: string[];
  href: string;
  keyFindings: string[];
  marketDynamics: ReportSection[];
  segments: ReportSection[];
  tableOfContents: string[];
  faqs: ReportFaq[];
  cta: SiteCta;
}

export interface TeamMember {
  name: string;
  role: string;
  credential: string;
  summary: string;
  imageSrc: string;
  profileHref?: string;
}

export const audiencePages: AudiencePage[] = [
  {
    slug: 'investors',
    navLabel: 'Investors',
    eyebrow: 'Capital and company diligence',
    title: 'See how CipherPlay turns emerging-tech theses into software ventures.',
    summary:
      'For investors evaluating the team, products, backers, industries, and venture-building focus behind CipherPlay.',
    proofPoints: [
      'Venture-backed studio model',
      'Randao as blockchain infrastructure proof',
      'Focused emerging-tech industry map',
    ],
    primaryCta: {
      label: 'Request investor materials',
      href: links.investorForm,
      eventName: 'cta_investor_materials',
      disabled: false,
    },
  },
  {
    slug: 'analysts',
    navLabel: 'Analysts',
    eyebrow: 'Market research and signal tracking',
    title: 'Read market research shaped by builders operating in emerging technology.',
    summary:
      'For analysts who want public market research reports, industry framing, and a path to request full reports by email.',
    proofPoints: [
      'Public Market Research reports',
      'Venture and market intelligence focus',
      'Research tied to product-building context',
    ],
    primaryCta: {
      label: 'Request full research access',
      href: links.analystForm,
      eventName: 'cta_research_access',
      disabled: false,
    },
  },
  {
    slug: 'partners',
    navLabel: 'Partners',
    eyebrow: 'Ecosystem and venture collaboration',
    title: 'Partner with a studio that can research, prototype, and ship.',
    summary:
      'For accelerators, ecosystems, labs, and companies exploring collaboration with CipherPlay.',
    proofPoints: [
      'Partner ecosystem relationships',
      'Product and protocol experience',
      'Market research plus software execution',
    ],
    primaryCta: {
      label: 'Propose a partnership',
      href: links.partnerForm,
      eventName: 'cta_partner_inquiry',
      disabled: false,
    },
  },
  {
    slug: 'customers',
    navLabel: 'Customers',
    eyebrow: 'Software and intelligence buyers',
    title: 'Explore emerging-tech software and market intelligence built for real decisions.',
    summary:
      'For customers evaluating CipherPlay products, research, or studio-built emerging-tech software.',
    proofPoints: [
      'Randao product proof',
      'AI and cryptographic software focus',
      'Research-backed build decisions',
    ],
    primaryCta: {
      label: 'Request consulting discovery',
      href: links.customerForm,
      eventName: 'cta_customer_discovery',
      disabled: false,
    },
  },
];

export const products: Product[] = [
  {
    slug: 'randao',
    name: 'RANDAO',
    status: 'Blockchain infrastructure',
    summary:
      'A decentralized random number generation protocol and product proof for CipherPlay work in cryptographic infrastructure.',
    href: '/products/randao',
    linkLabel: 'View product',
    cta: {
      label: 'Request a product briefing',
      href: links.customerForm,
      eventName: 'cta_customer_discovery',
      disabled: false,
    },
  },
];

export const serviceOfferings: ServiceOffering[] = [
  {
    slug: 'infrastructure-software-consulting',
    name: 'Infrastructure & software consulting',
    status: 'Current service',
    summary:
      'CipherPlay provides blockchain, AI, and VR infrastructure/software consulting for teams that need technical architecture, prototypes, integrations, and research-backed product execution.',
    capabilities: [
      'Blockchain infrastructure',
      'AI systems and workflows',
      'VR software and interfaces',
      'Technical architecture, prototypes, and integrations',
    ],
    cta: {
      label: 'Request consulting discovery',
      href: links.customerForm,
      eventName: 'cta_customer_discovery',
      disabled: false,
    },
  },
];

export const productHistory: Product[] = [
  {
    slug: 'satoshis-palace',
    name: "Satoshi's Palace",
    status: 'Historic / Sunset',
    summary:
      'An online Bitcoin prediction market built on Secret Network, retained as founder and product history. It is no longer a current product and has no active website.',
  },
  {
    slug: 'runerealm',
    name: 'RuneRealm',
    status: 'Historic / Sunset',
    summary:
      'An onchain MMORPG experiment preserved as historical product context for CipherPlay work in fully onchain software and game infrastructure. It is not a current product.',
    href: links.runeRealm,
    linkLabel: 'View archived project',
  },
];

export const industryPillars: IndustryPillar[] = [
  {
    name: 'AI Productivity Software',
    summary:
      'Software that helps teams use AI systems for practical research, automation, and decision support.',
    audienceFit:
      'Useful to customers and partners evaluating where AI can reduce coordination cost without losing operational control.',
    proofHref: '/market-analysis',
  },
  {
    name: 'Web3 Node Infrastructure',
    summary:
      'Infrastructure for decentralized networks where reliability, incentive alignment, and operator experience matter.',
    audienceFit:
      'Relevant to investors and partners assessing durable Web3 infrastructure needs beyond speculative cycles.',
    proofHref: '/products/randao',
  },
  {
    name: 'Cryptographic Protocols',
    summary:
      'Protocol design and productization around trust, randomness, verification, and secure coordination.',
    audienceFit:
      'Relevant to analysts and technical customers tracking applied cryptography and product-ready trust systems.',
    proofHref: '/products/randao',
  },
  {
    name: 'Venture/Market Intelligence',
    summary:
      'Research systems that turn emerging-technology signals into clearer market maps and venture theses.',
    audienceFit:
      'Relevant to investors and analysts who need concise public framing before requesting deeper diligence.',
    proofHref: '/market-analysis',
  },
  {
    name: 'AI Research Software',
    summary:
      'Tools for researchers and builders who need AI-assisted workflows around literature, experiments, and technical synthesis.',
    audienceFit:
      'Relevant to customers and partners looking for software that supports higher-quality technical research loops.',
    proofHref: '/market-analysis',
  },
];

export const marketResearchReports: MarketResearchReport[] = [
  {
    slug: 'ai-productivity-software',
    title: 'AI Productivity Software Market Research Report',
    eyebrow: 'Market Research Report',
    reportCode: 'CP-MR-AI-001',
    executiveSummary:
      'CipherPlay analyzes AI productivity software as a market shaped by workflow specificity, buyer trust, integration depth, and measurable team outcomes. The public report explains how demand is moving from general-purpose assistants toward tools embedded in concrete research, operations, engineering, sales, and support workflows.',
    industries: ['AI Productivity Software', 'AI Research Software'],
    href: '/market-analysis/ai-productivity-software',
    keyFindings: [
      'Teams are more likely to adopt AI productivity software when the product maps directly to an existing workflow instead of asking users to invent new habits.',
      'Trust, reviewability, and permissioning are becoming product requirements, especially when AI tools touch customer data, technical decisions, or regulated work.',
      'The strongest product opportunities sit between horizontal AI chat interfaces and fully bespoke internal automation.',
      'Market winners will likely package AI capability with onboarding, measurement, and domain-specific operating knowledge.',
    ],
    marketDynamics: [
      {
        title: 'Workflow depth over model novelty',
        body:
          'Model capability matters, but buyers increasingly evaluate whether the software can fit the work, preserve context, and make outputs reviewable. Products with clear workflow ownership are easier to justify than broad assistants with unclear ROI.',
      },
      {
        title: 'Governance as a purchase driver',
        body:
          'Security review, audit trails, source visibility, and role-based access can move from back-office concerns into central buying criteria. This favors vendors that can explain both product value and operational control.',
      },
      {
        title: 'Services-to-software wedge',
        body:
          'Many teams still need help translating AI capability into useful internal workflows. Research-backed studios and product teams can use implementation work to discover repeatable software opportunities.',
      },
    ],
    segments: [
      {
        title: 'Research and synthesis tools',
        body:
          'Products that help teams search, summarize, compare, and cite technical or market information while keeping source trails visible.',
      },
      {
        title: 'Operational copilots',
        body:
          'Tools that sit inside recurring business workflows such as support triage, sales preparation, internal reporting, and project coordination.',
      },
      {
        title: 'Developer and technical productivity',
        body:
          'AI systems that support code review, documentation, debugging, and systems understanding without replacing engineering judgment.',
      },
    ],
    tableOfContents: [
      'Executive summary',
      'Market definition and buyer categories',
      'Workflow adoption drivers',
      'Trust, security, and governance requirements',
      'Segment map and product opportunity areas',
      'Signals CipherPlay is tracking',
      'Company and investor implications',
    ],
    faqs: [
      {
        question: 'Is this report about model providers?',
        answer:
          'The report focuses on software products and buyer workflows rather than ranking foundation model providers.',
      },
      {
        question: 'Does the public page include the full report?',
        answer:
          'No. This page includes useful public analysis, while the full report is intended for delivery through the request form flow.',
      },
      {
        question: 'Who is this report for?',
        answer:
          'It is written for investors, analysts, partners, and customers evaluating AI productivity software opportunities.',
      },
    ],
    cta: {
      label: 'Request full report by email',
      href: links.reportRequestForm,
      eventName: 'cta_research_access',
      disabled: false,
    },
  },
  {
    slug: 'cryptographic-infrastructure',
    title: 'Cryptographic Infrastructure Market Research Report',
    eyebrow: 'Market Research Report',
    reportCode: 'CP-MR-CRYPTO-001',
    executiveSummary:
      'CipherPlay tracks cryptographic infrastructure through the lens of trust-sensitive software: randomness, verification, node operations, and protocol reliability. The public report connects market demand to product proof from Randao and to broader infrastructure needs across decentralized systems.',
    industries: ['Web3 Node Infrastructure', 'Cryptographic Protocols'],
    href: '/market-analysis/cryptographic-infrastructure',
    keyFindings: [
      'Infrastructure buyers care less about abstract decentralization claims and more about reliability, verifiability, uptime, and integration cost.',
      'Randomness, identity, proofs, and node operations remain foundational primitives for trust-sensitive applications.',
      'Products that make cryptographic systems easier to operate can expand the market beyond specialist protocol teams.',
      'Clear technical education is part of the product surface because buyers need to understand where trust assumptions live.',
    ],
    marketDynamics: [
      {
        title: 'Trust primitives need product packaging',
        body:
          'Cryptographic primitives create value only when builders can integrate them safely. Documentation, SDKs, observability, and operational support can be as important as the protocol itself.',
      },
      {
        title: 'Node infrastructure is becoming more specialized',
        body:
          'Different networks and protocols ask operators to solve different reliability, incentive, and monitoring problems. This creates room for focused tooling rather than one generic infrastructure stack.',
      },
      {
        title: 'Verification is a user experience problem',
        body:
          'Many users want stronger trust guarantees but cannot evaluate low-level protocol details. Products that expose clear verification paths can reduce the gap between cryptographic rigor and buyer confidence.',
      },
    ],
    segments: [
      {
        title: 'Randomness and coordination protocols',
        body:
          'Systems that support fair selection, secure coordination, games, simulations, and other workflows where unpredictable outcomes matter.',
      },
      {
        title: 'Node operator tooling',
        body:
          'Monitoring, deployment, alerting, and lifecycle tools for teams running decentralized network infrastructure.',
      },
      {
        title: 'Protocol integration software',
        body:
          'SDKs, APIs, dashboards, and documentation that make cryptographic protocols usable by application developers.',
      },
    ],
    tableOfContents: [
      'Executive summary',
      'Infrastructure market definition',
      'Trust primitive landscape',
      'Randao product proof',
      'Buyer needs and integration barriers',
      'Segment map',
      'Signals CipherPlay is tracking',
    ],
    faqs: [
      {
        question: 'How does this relate to Randao?',
        answer:
          'Randao is used as a public product proof for applied randomness and cryptographic infrastructure.',
      },
      {
        question: 'Is this a public dashboard or analytics product?',
        answer:
          'No. This report is market research. CipherPlay site analytics remain private operational infrastructure.',
      },
      {
        question: 'Does the report publish private product plans?',
        answer:
          'No. Public content avoids go-to-market details and keeps deeper materials gated for approved email delivery.',
      },
    ],
    cta: {
      label: 'Request full report by email',
      href: links.reportRequestForm,
      eventName: 'cta_research_access',
      disabled: false,
    },
  },
  {
    slug: 'venture-market-intelligence',
    title: 'Emerging-Tech Venture Intelligence Market Research Report',
    eyebrow: 'Market Research Report',
    reportCode: 'CP-MR-VENTURE-001',
    executiveSummary:
      'CipherPlay frames venture and market intelligence as a practical system for understanding emerging-technology opportunities before they become obvious. The public report explains how product proof, ecosystem signals, technical research, and buyer pain can inform stronger diligence.',
    industries: ['Venture/Market Intelligence', 'AI Research Software'],
    href: '/market-analysis/venture-market-intelligence',
    keyFindings: [
      'Emerging-technology diligence benefits from combining market maps with builder-level product understanding.',
      'Signals from accelerators, protocol communities, technical media, and customer workflows can reveal opportunity before financial metrics mature.',
      'Analyst workflows increasingly need AI support, but source traceability and judgment remain central to quality.',
      'Studios with software execution capability can test market theses through prototypes and early products.',
    ],
    marketDynamics: [
      {
        title: 'Signal quality over signal volume',
        body:
          'Emerging markets produce noisy public information. Useful intelligence depends on filtering signals by buyer urgency, technical feasibility, and ecosystem momentum.',
      },
      {
        title: 'Product proof improves diligence',
        body:
          'A working product or credible prototype can validate a thesis more effectively than narrative alone, especially in technical markets.',
      },
      {
        title: 'Research workflows are becoming software workflows',
        body:
          'Analysts are adopting AI-assisted search, synthesis, and monitoring, but still need structured frameworks that keep conclusions explainable.',
      },
    ],
    segments: [
      {
        title: 'Investor diligence support',
        body:
          'Market maps, product context, and technical signal tracking for investors evaluating emerging-technology opportunities.',
      },
      {
        title: 'Analyst research systems',
        body:
          'Tools and processes for source collection, synthesis, report drafting, and ongoing market monitoring.',
      },
      {
        title: 'Venture studio thesis development',
        body:
          'Research-backed opportunity discovery tied to the ability to prototype and ship software.',
      },
    ],
    tableOfContents: [
      'Executive summary',
      'Market intelligence framework',
      'Signal categories and weighting',
      'Product proof in venture diligence',
      'AI-assisted analyst workflows',
      'Segment map',
      'Implications for investors and partners',
    ],
    faqs: [
      {
        question: 'Is this report investment advice?',
        answer:
          'No. The report is market research and company framing, not investment, legal, or financial advice.',
      },
      {
        question: 'What makes the research builder-informed?',
        answer:
          'CipherPlay connects market framing with product execution, technical review, and the constraints teams encounter while building.',
      },
      {
        question: 'Can readers request the complete report?',
        answer:
          'Yes. The request CTA points readers into the form flow for full-report delivery.',
      },
    ],
    cta: {
      label: 'Request full report by email',
      href: links.reportRequestForm,
      eventName: 'cta_research_access',
      disabled: false,
    },
  },
];

export const mediaAssets: MediaAsset[] = [
  {
    title: 'CipherPlay Symbol',
    kind: 'logo',
    previewSrc: '/media-kit/Logo.svg',
    downloadHref: '/media-kit/Logo.svg',
    format: 'SVG',
  },
  {
    title: 'CipherPlay Wordmark',
    kind: 'logo',
    previewSrc: '/media-kit/LogoText_V1.svg',
    downloadHref: '/media-kit/LogoText_V1.svg',
    format: 'SVG',
  },
  {
    title: 'Gradient Symbol',
    kind: 'logo',
    previewSrc: '/media-kit/Logo_Gradient.svg',
    downloadHref: '/media-kit/Logo_Gradient.svg',
    format: 'SVG',
  },
  {
    title: 'Website Social Card',
    kind: 'banner',
    previewSrc: '/media-kit/Banner_Website_1200x630.jpg',
    downloadHref: '/media-kit/Banner_Website_1200x630.jpg',
    format: 'JPG',
  },
  {
    title: 'LinkedIn Company Banner',
    kind: 'banner',
    previewSrc: '/media-kit/Banner_LinkedIn_company_1128x191.jpg',
    downloadHref: '/media-kit/Banner_LinkedIn_company_1128x191.jpg',
    format: 'JPG',
  },
  {
    title: 'X Banner',
    kind: 'banner',
    previewSrc: '/media-kit/Banner_X_Twitter_1500x500.jpg',
    downloadHref: '/media-kit/Banner_X_Twitter_1500x500.jpg',
    format: 'JPG',
  },
  {
    title: 'Approved Media Kit Package',
    kind: 'package',
    previewSrc: '/img/cipherplay/logo-gradient.svg',
    downloadHref: '/media-kit/cipherplay-media-kit.zip',
    format: 'ZIP',
  },
];

export const teamMembers: TeamMember[] = [
  {
    name: 'Allan B. Pedin IV',
    role: 'CEO',
    credential: 'M.S. CPSC; academic turned entrepreneur.',
    summary:
      'Leads CipherPlay across company strategy, venture framing, product thesis development, and market research direction.',
    imageSrc: '/img/headshot.png',
    profileHref: links.allanLinkedIn,
  },
  {
    name: 'Tyler Warburton',
    role: 'CTO',
    credential: 'B.S. CPSC & Cyber; cybersecurity professional and entrepreneur.',
    summary:
      'Leads technical architecture and software execution for CipherPlay products and emerging-technology systems.',
    imageSrc: '/img/team/tyler-warburton.svg',
    profileHref: links.tylerLinkedIn,
  },
  {
    name: 'Alex Posey',
    role: 'COO',
    credential: 'Computer scientist; Web3 software consultant.',
    summary:
      'Leads operating cadence, coordination, and execution systems as CipherPlay moves research-backed work into shipped products.',
    imageSrc: '/img/team/alex-posey.svg',
  },
];

export const organizationProof: OrganizationProof[] = [
  {
    name: 'Forward Research',
    href: links.forwardResearch,
    logoSrc: '/img/organizations/forward-research.svg',
    relationship: 'backer',
  },
  {
    name: 'VIPC',
    href: links.vipc,
    logoSrc: '/img/organizations/vipc.svg',
    relationship: 'backer',
  },
  {
    name: 'RAMP',
    href: links.ramp,
    logoSrc: '/img/organizations/ramp.svg',
    relationship: 'backer',
  },
  {
    name: 'AR.IO',
    href: links.ario,
    relationship: 'partner-ecosystem',
  },
  {
    name: 'Arweave',
    href: links.arweave,
    relationship: 'partner-ecosystem',
  },
  {
    name: 'Virginia Blockchain Council',
    href: links.virginiaBlockchainCouncil,
    relationship: 'partner-ecosystem',
  },
  {
    name: 'Startup Virginia',
    href: links.startupVirginia,
    logoSrc: '/img/organizations/startup-virginia.svg',
    relationship: 'partner-ecosystem',
  },
  {
    name: 'Founder Institute',
    href: links.founderInstitute,
    logoSrc: '/img/organizations/founder-institute.svg',
    relationship: 'partner-ecosystem',
  },
  {
    name: 'VIPC',
    href: links.vipc,
    logoSrc: '/img/organizations/vipc.svg',
    relationship: 'partner-ecosystem',
  },
];

export const backers = organizationProof.filter(
  (organization) => organization.relationship === 'backer',
);

export const partnerEcosystem = organizationProof.filter(
  (organization) => organization.relationship === 'partner-ecosystem',
);

export const brandColors = [
  {name: 'White', value: '#D9D9D9'},
  {name: 'Gray', value: '#444444'},
  {name: 'Very Dark Blue', value: '#0E6B99'},
  {name: 'Dark Blue', value: '#1EA5B4'},
  {name: 'Light Blue', value: '#37FFDE'},
] as const;
