export const links = {
  cipherplayLinkedIn: 'https://www.linkedin.com/company/cipherplay',
  allanLinkedIn: 'https://www.linkedin.com/in/allan-b-pedin-iv/',
  tylerLinkedIn: 'https://www.linkedin.com/in/tyler-warburton/',
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
