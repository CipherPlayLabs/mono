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
  forwardResearch: 'https://forward.arweave.net/',
  vipc: 'https://vipc.org/',
  ramp: 'https://ramprb.com/',
  startupVirginia: 'https://www.startupvirginia.org/',
  founderInstitute: 'https://fi.co/',
  investorForm: '/forms/investor-materials',
  analystForm: '/forms/research-access',
  partnerForm: '/forms/partnership',
  customerForm: '/forms/consulting-discovery',
  reportRequestForm: '/forms/report-request',
} as const;

export type LinkKey = keyof typeof links;
