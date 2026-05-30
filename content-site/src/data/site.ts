import {links} from '../../links';

export interface SiteCta {
  label: string;
  href: string;
  eventName: string;
  disabled: boolean;
}

export interface PageBrief {
  eyebrow: string;
  title: string;
  summary: string;
  signals: string[];
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
  kind: 'logo' | 'banner' | 'background' | 'font' | 'package';
  previewSrc: string;
  downloadHref: string;
  format: string;
}

export interface OrganizationEntry {
  name: string;
  href: string;
  logoSrc?: string;
  logoFrame?: 'light' | 'dark';
  relationship: 'backer' | 'partner-ecosystem';
}

export interface TeamMember {
  name: string;
  role: string;
  credential: string;
  summary: string;
  imageSrc: string;
  profileHref?: string;
}

export const investorDiligence: Pick<PageBrief, 'signals' | 'primaryCta'> = {
  signals: [
    'Venture-backed studio model',
    'RANDAO anchors blockchain infrastructure work',
    'Focused emerging-technology industry map',
  ],
  primaryCta: {
    label: 'Request investor materials',
    href: links.investorForm,
    eventName: 'cta_investor_materials',
    disabled: false,
  },
};

export const partnerPage: PageBrief = {
  eyebrow: 'Ecosystem and venture collaboration',
  title: 'Partner with a studio that can research, prototype, and ship.',
  summary:
    'For accelerators, ecosystems, labs, and companies exploring collaboration with CipherPlay.',
  signals: [
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
};

export const products: Product[] = [
  {
    slug: 'randao',
    name: 'RANDAO',
    status: 'Blockchain infrastructure',
    summary:
      'A CipherPlay-owned and operated product for decentralized and verifiable randomness in blockchain and cryptographic infrastructure.',
    href: '/products/randao',
    linkLabel: 'View product',
    cta: {
      label: 'Request a demo',
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
      'CipherPlay provides blockchain, AI, and Spatial Computing infrastructure/software consulting for teams that need technical architecture, prototypes, integrations, and research-backed product execution.',
    capabilities: [
      'Blockchain infrastructure',
      'AI systems and workflows',
      'Spatial Computing software and interfaces',
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
      'An onchain MMORPG experiment preserved as historical product work for CipherPlay in fully onchain software and game infrastructure. It is not a current product.',
    href: links.runeRealm,
    linkLabel: 'View archived project',
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
    title: 'Website Preview Card',
    kind: 'banner',
    previewSrc: '/media-kit/Banner_Website_1200x630.jpg',
    downloadHref: '/media-kit/Banner_Website_1200x630.jpg',
    format: 'JPG',
  },
  {
    title: 'Wide Header Banner',
    kind: 'banner',
    previewSrc: '/media-kit/Banner_LinkedIn_company_1128x191.jpg',
    downloadHref: '/media-kit/Banner_LinkedIn_company_1128x191.jpg',
    format: 'JPG',
  },
  {
    title: 'Panoramic Header Banner',
    kind: 'banner',
    previewSrc: '/media-kit/Banner_X_Twitter_1500x500.jpg',
    downloadHref: '/media-kit/Banner_X_Twitter_1500x500.jpg',
    format: 'JPG',
  },
  {
    title: 'Youre Gone Display Font',
    kind: 'font',
    previewSrc: '/media-kit/LogoText_V1.svg',
    downloadHref: '/media-kit/Youre%20Gone.otf',
    format: 'OTF',
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
    imageSrc: '/img/team/tyler-warburton.jpeg',
    profileHref: links.tylerLinkedIn,
  },
  {
    name: 'Alex Posey',
    role: 'COO',
    credential: 'Computer scientist; Web3 software consultant.',
    summary:
      'Leads operating cadence, coordination, and execution systems as CipherPlay moves research-backed work into shipped products.',
    imageSrc: '/img/team/alex-posey.png',
  },
];

export const organizationEntries: OrganizationEntry[] = [
  {
    name: 'Forward Research',
    href: links.forwardResearch,
    logoSrc: '/img/organizations/forward-research.jpg',
    relationship: 'backer',
  },
  {
    name: 'VIPC',
    href: links.vipc,
    logoSrc: '/img/organizations/vipc.png',
    relationship: 'backer',
  },
  {
    name: 'RAMP',
    href: links.ramp,
    logoSrc: '/img/organizations/ramp.svg',
    logoFrame: 'dark',
    relationship: 'backer',
  },
  {
    name: 'RBTC / RBIA',
    href: links.rbtcRbia,
    logoSrc: '/img/organizations/rbtc-rbia.png',
    relationship: 'partner-ecosystem',
  },
  {
    name: 'AR.IO',
    href: links.ario,
    logoSrc: '/img/organizations/ario.svg',
    relationship: 'partner-ecosystem',
  },
  {
    name: 'Arweave',
    href: links.arweave,
    logoSrc: '/img/organizations/arweave.svg',
    relationship: 'partner-ecosystem',
  },
  {
    name: 'Virginia Blockchain Council',
    href: links.virginiaBlockchainCouncil,
    logoSrc: '/img/organizations/virginia-blockchain-council.jpg',
    relationship: 'partner-ecosystem',
  },
  {
    name: 'Startup Virginia',
    href: links.startupVirginia,
    logoSrc: '/img/organizations/startup-virginia.jpg',
    relationship: 'partner-ecosystem',
  },
  {
    name: 'Founder Institute',
    href: links.founderInstitute,
    logoSrc: '/img/organizations/founder-institute.png',
    relationship: 'partner-ecosystem',
  },
  {
    name: 'VIPC',
    href: links.vipc,
    logoSrc: '/img/organizations/vipc.png',
    relationship: 'partner-ecosystem',
  },
];

export const backers = organizationEntries.filter(
  (organization) => organization.relationship === 'backer',
);

export const partnerEcosystem = organizationEntries.filter(
  (organization) => organization.relationship === 'partner-ecosystem',
);

export const brandColors = [
  {name: 'White', value: '#D9D9D9'},
  {name: 'Gray', value: '#444444'},
  {name: 'Very Dark Blue', value: '#0E6B99'},
  {name: 'Dark Blue', value: '#1EA5B4'},
  {name: 'Light Blue', value: '#37FFDE'},
] as const;
