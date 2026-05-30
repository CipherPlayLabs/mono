const trackedOutboundUrl = (href: string, utmContent: string): string => {
  const url = new URL(href);
  url.searchParams.set('utm_source', 'cipherplay.net');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'content_site');
  url.searchParams.set('utm_content', utmContent);
  return url.toString();
};

export const links = {
  cipherplayLinkedIn: trackedOutboundUrl(
    'https://www.linkedin.com/company/cipherplay',
    'company_linkedin',
  ),
  allanLinkedIn: trackedOutboundUrl(
    'https://www.linkedin.com/in/allan-b-pedin-iv/',
    'team_allan_linkedin',
  ),
  allanWebsite: trackedOutboundUrl(
    'https://allanbpediniv.com/',
    'team_allan_website',
  ),
  tylerLinkedIn: trackedOutboundUrl(
    'https://www.linkedin.com/in/tyler-warburton/',
    'team_tyler_linkedin',
  ),
  randao: 'https://randao.net/',
  randaoWhitepaper: 'https://randao-whitepaper.ar.io/',
  runeRealm: 'https://runerealm-onchain_game.arweave.net/',
  ario: 'https://ar.io/',
  arweave: 'https://www.arweave.com/',
  virginiaBlockchainCouncil: 'https://vablockcouncil.org/',
  rbtcRbia: 'https://www.rbtc.tech/about/rbia/',
  forwardResearch: 'https://x.com/fwdresearch?lang=en',
  vipc: 'https://vipc.org/',
  ramp: 'https://ramprb.com',
  startupVirginia: 'https://startupvirginia.org',
  founderInstitute: 'https://fi.co/',
  investorForm: 'https://forms.cipherplay.net/form/investor-materials',
  partnerForm: 'https://forms.cipherplay.net/form/partnership',
  customerForm: 'https://forms.cipherplay.net/form/consulting-discovery',
  reportRequestForm: 'https://forms.cipherplay.net/form/report-request',
} as const;

export type LinkKey = keyof typeof links;
