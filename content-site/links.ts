export const links = {
  cipherplayLinkedIn: 'https://www.linkedin.com/company/cipherplay',
  allanLinkedIn: 'https://www.linkedin.com/in/allan-b-pedin-iv/',
  tylerLinkedIn: 'https://www.linkedin.com/in/tyler-warburton/',
  randao: 'https://randao.net/',
  randaoWhitepaper: 'https://randao-whitepaper.ar.io/',
  runeRealm: 'https://runerealm-onchain_game.arweave.net/',
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
