export interface MediaItem {
  title: string;
  outlet: string;
  description: string;
  preview: string;
  website: string;
  date: string;
}

export const mediaItems: MediaItem[] = [
  {
    title: 'Why Blockchains Can\'t Be Random (And Why It Matters for Trust)',
    outlet: 'NDK CYBER - Secure Insights',
    description:
      'An in-depth discussion on why blockchains cannot be random and why this matters for trust in decentralized systems.',
    preview: 'https://i.ytimg.com/vi/3knbD6F4cUo/hqdefault.jpg',
    website: 'https://www.youtube.com/watch?v=3knbD6F4cUo',
    date: '2026-01-15',
  },
  {
    title: 'RandAO Builder Spotlight with Allan Pedin',
    outlet: 'Community Labs',
    description:
      'Builder spotlight featuring Allan Pedin discussing RandAO and decentralized random number generation.',
    preview: 'https://i.ytimg.com/vi/LOlYGTt1LIc/hqdefault.jpg',
    website: 'https://www.youtube.com/watch?v=LOlYGTt1LIc',
    date: '2025-05-10',
  },
  {
    title: 'RandAO Keynote - ETH Denver 2025',
    outlet: 'RandAO',
    description:
      'Keynote presentation at ETH Denver 2025 on RandAO and the future of decentralized applications.',
    preview: 'https://i.ytimg.com/vi/z9hJnxGRxj4/hqdefault.jpg',
    website: 'https://www.youtube.com/watch?v=z9hJnxGRxj4',
    date: '2025-03-03',
  },
  {
    title: 'SE02E15 How To Sell When You Sell Random Numbers',
    outlet: 'Colin Davis',
    description:
      'Episode 15 discussing how to sell products or services when your offering is based on random numbers.',
    preview: 'https://i.ytimg.com/vi/P1aC2AMTdgE/hqdefault.jpg',
    website: 'https://www.youtube.com/watch?v=P1aC2AMTdgE',
    date: '2026-03-05',
  },
];
