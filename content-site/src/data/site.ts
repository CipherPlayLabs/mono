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

export interface IndustryPillar {
  name: string;
  summary: string;
  audienceFit: string;
  proofHref: string;
}

export interface MarketAnalysisTeaser {
  slug: string;
  title: string;
  executiveSummary: string;
  industries: string[];
  cta: SiteCta;
}

export interface TeamMember {
  name: string;
  role: string;
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
      'Randao as first product proof',
      'Focused emerging-tech industry map',
    ],
    primaryCta: {
      label: 'Request investor materials',
      href: links.investorForm,
      eventName: 'cta_investor_materials',
      disabled: true,
    },
  },
  {
    slug: 'analysts',
    navLabel: 'Analysts',
    eyebrow: 'Market research and signal tracking',
    title: 'Read market analysis shaped by builders operating in emerging technology.',
    summary:
      'For analysts who want public research previews, industry framing, and a path to request full reports.',
    proofPoints: [
      'Public report teasers',
      'Venture and market intelligence focus',
      'Research tied to product-building context',
    ],
    primaryCta: {
      label: 'Request full research access',
      href: links.analystForm,
      eventName: 'cta_research_access',
      disabled: true,
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
      'Strategic startup ecosystem connections',
      'Product and protocol experience',
      'Market research plus software execution',
    ],
    primaryCta: {
      label: 'Propose a partnership',
      href: links.partnerForm,
      eventName: 'cta_partner_inquiry',
      disabled: true,
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
      label: 'Start a discovery request',
      href: links.customerForm,
      eventName: 'cta_customer_discovery',
      disabled: true,
    },
  },
];

export const products: Product[] = [
  {
    slug: 'randao',
    name: 'Randao',
    status: 'First product',
    summary:
      'A decentralized random number generation protocol and product proof for CipherPlay work in cryptographic infrastructure.',
    href: '/products/randao',
    cta: {
      label: 'Request a product briefing',
      href: links.customerForm,
      eventName: 'cta_customer_discovery',
      disabled: true,
    },
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

export const marketAnalysisTeasers: MarketAnalysisTeaser[] = [
  {
    slug: 'ai-productivity-software',
    title: 'AI Productivity Software Market Map',
    executiveSummary:
      'A public preview of how CipherPlay frames buyer needs, workflow constraints, and product opportunities in AI productivity software.',
    industries: ['AI Productivity Software', 'AI Research Software'],
    cta: {
      label: 'Request full report',
      href: links.reportRequestForm,
      eventName: 'cta_research_access',
      disabled: true,
    },
  },
  {
    slug: 'cryptographic-infrastructure',
    title: 'Cryptographic Infrastructure Signals',
    executiveSummary:
      'A teaser on trust, randomness, and node infrastructure markets, anchored by the Randao product thesis.',
    industries: ['Web3 Node Infrastructure', 'Cryptographic Protocols'],
    cta: {
      label: 'Request full report',
      href: links.reportRequestForm,
      eventName: 'cta_research_access',
      disabled: true,
    },
  },
  {
    slug: 'venture-market-intelligence',
    title: 'Emerging-Tech Venture Intelligence',
    executiveSummary:
      'A public preview of how market signals, product proof, and founder research can support venture diligence.',
    industries: ['Venture/Market Intelligence', 'AI Research Software'],
    cta: {
      label: 'Request full report',
      href: links.reportRequestForm,
      eventName: 'cta_research_access',
      disabled: true,
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
    summary:
      'Leads CipherPlay across company strategy, venture framing, product thesis development, and market research direction.',
    imageSrc: '/img/headshot.png',
    profileHref: links.allanLinkedIn,
  },
  {
    name: 'Tyler Warburton',
    role: 'CTO',
    summary:
      'Leads technical architecture and software execution for CipherPlay products and emerging-technology systems.',
    imageSrc: '/img/team/tyler-warburton.svg',
    profileHref: links.tylerLinkedIn,
  },
  {
    name: 'Alex Posey',
    role: 'COO',
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
    name: 'Startup Virginia',
    href: links.startupVirginia,
    logoSrc: '/img/organizations/startup-virginia.svg',
    relationship: 'strategic-connection',
  },
  {
    name: 'Founder Institute',
    href: links.founderInstitute,
    logoSrc: '/img/organizations/founder-institute.svg',
    relationship: 'strategic-connection',
  },
];

export const backers = organizationProof.filter(
  (organization) => organization.relationship === 'backer',
);

export const strategicConnections = organizationProof.filter(
  (organization) => organization.relationship === 'strategic-connection',
);

export const brandColors = [
  {name: 'White', value: '#D9D9D9'},
  {name: 'Gray', value: '#444444'},
  {name: 'Very Dark Blue', value: '#0E6B99'},
  {name: 'Dark Blue', value: '#1EA5B4'},
  {name: 'Light Blue', value: '#37FFDE'},
] as const;
