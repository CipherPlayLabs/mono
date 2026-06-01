import {links} from '../../links';
import type {SiteCta} from './site';

export interface StateOfWeb3Audience {
  audience: string;
  outcome: string;
}

export interface StateOfWeb3RelatedClass {
  label: string;
  support: string;
}

export interface StateOfWeb3Report {
  slug: string;
  reportNumber: number;
  side: 'Buidler report' | 'Provider report';
  peopleClass: string;
  title: string;
  headline: string;
  methods: string;
  codedEvidence: string;
  work: string;
  serves: StateOfWeb3Audience[];
  relatedSupport: StateOfWeb3RelatedClass[];
  overallSummary: string;
  lockedGraph: {
    title: string;
    teaser: string;
    previewBars: string[];
  };
  lockedFurtherResearch: {
    title: string;
    teaser: string;
  };
}

export const stateOfWeb3FullReportCta: SiteCta = {
  label: 'Get the complete State of Web3 report',
  href: links.reportRequestForm,
  eventName: 'cta_state_of_web3_full_report',
  disabled: false,
  proof:
    'Get the complete evidence pack: chart patterns, priority signals, and follow-up questions for the decisions that need more certainty.',
};

export const stateOfWeb3ReadCta: SiteCta = {
  label: 'Read State of Web3',
  href: '/market-analysis/state-of-web3',
  eventName: 'cta_state_of_web3_read',
  disabled: false,
};

export const stateOfWeb3 = {
  slug: 'state-of-web3',
  title: 'State Of Web3',
  eyebrow: 'Aggregate Market Research',
  href: '/market-analysis/state-of-web3',
  summary:
    'A composed public view of customer discovery across buidler and provider-side Web3 work, organized into eight People-Class Reports.',
  framing:
    'Across the reports, Web3 teams are trying to create products that are adopted, trusted, usable, and durable enough for real customers.',
};

const graphPreviewBars = ['Need cluster A', 'Need cluster B', 'Need cluster C', 'Need cluster D'];

export const stateOfWeb3Reports: StateOfWeb3Report[] = [
  {
    slug: 'developers-building-on-new-chains',
    reportNumber: 1,
    side: 'Buidler report',
    peopleClass: 'Developers',
    title: 'Developers Building On New Chains',
    headline:
      'Developers need a faster path to a trustworthy first build when they evaluate unfamiliar chains, protocols, SDKs, or infrastructure.',
    methods:
      'CipherPlay interviewed developers from across Web3 and synthesized Jobs to be Done analyses around chain, protocol, SDK, and infrastructure evaluation.',
    codedEvidence: '40 coded need signals from 10 included interviews.',
    work:
      'Developers are trying to get to a working build without getting stuck on documentation, setup, configuration, examples, architecture, cost, compatibility, or support gaps.',
    serves: [
      {
        audience: 'App and protocol users',
        outcome: 'Working products that are usable, reliable, and affordable enough to adopt.',
      },
      {
        audience: 'Founders and operators',
        outcome: 'Faster build cycles that create demos, traction proof, and revenue paths.',
      },
      {
        audience: 'Ecosystem teams',
        outcome: 'Apps and builders that make a chain or protocol worth joining.',
      },
      {
        audience: 'Wallet, payment, and agent teams',
        outcome: 'Technical foundations for payment, wallet, and autonomous-transaction workflows.',
      },
    ],
    relatedSupport: [
      {
        label: 'Blockchain relations teams',
        support: 'Documentation, tutorials, grants, and support loops.',
      },
      {
        label: 'Audit providers',
        support: 'Security assurance and launch-readiness proof as the build approaches trust review.',
      },
      {
        label: 'GTM teams',
        support: 'Business path and market access after the first working build.',
      },
    ],
    overallSummary:
      'The core market signal is not abstract developer experience; it is the practical work of getting unstuck, controlling costs, and trusting the chain or protocol enough to build again.',
    lockedGraph: {
      title: 'Self-Identified Project Needs',
      teaser:
        'Coded need signals, interview evidence density, and representative signals are available in the full report.',
      previewBars: graphPreviewBars,
    },
    lockedFurtherResearch: {
      title: 'Further Research',
      teaser:
        'The follow-up interview roadmap and priority/satisfaction validation prompts are included in the full report.',
    },
  },
  {
    slug: 'founders-proving-business-viability',
    reportNumber: 2,
    side: 'Buidler report',
    peopleClass: 'Founders and operators',
    title: 'Founders Proving Business Viability',
    headline:
      'Founders and operators need durable proof that a product, launch, or venture thesis can become a real business.',
    methods:
      'CipherPlay interviewed founders and operators from across Web3 and synthesized JTBD evidence around product viability, traction, and business proof.',
    codedEvidence: '39 coded need signals from 10 included interviews.',
    work:
      'Founders and operators are trying to turn a built product or venture thesis into users, buyers, investor attention, retained usage, revenue, market feedback, or credible proof points.',
    serves: [
      {
        audience: 'Customers and users',
        outcome: 'Products that solve a real problem and retain usage.',
      },
      {
        audience: 'Investors',
        outcome: 'Evidence of venture-scale upside, traction, velocity, and credible market feedback.',
      },
      {
        audience: 'Ecosystems and chains',
        outcome: 'Apps and businesses that create durable activity, revenue, or ecosystem proof.',
      },
      {
        audience: 'Internal teams',
        outcome: 'A clearer operating path for product, sales, marketing, and support.',
      },
    ],
    relatedSupport: [
      {
        label: 'GTM teams',
        support: 'Qualified pipeline, trusted narrative, investor visibility, and market feedback.',
      },
      {
        label: 'Audit providers',
        support: 'Security and launch-readiness proof that can be reused with investors or customers.',
      },
      {
        label: 'Blockchain relations teams',
        support: 'Programs that convert grants or hackathons into retained usage and viability signals.',
      },
    ],
    overallSummary:
      'The strongest signal is the need for durable evidence: retained users, qualified customers, revenue, investor conviction, credible narrative, or trusted launch readiness.',
    lockedGraph: {
      title: 'Self-Identified Project Needs',
      teaser:
        'The full report shows how coded criteria concentrate around traction proof, execution, revenue durability, and trust readiness.',
      previewBars: graphPreviewBars,
    },
    lockedFurtherResearch: {
      title: 'Further Research',
      teaser:
        'The full report separates founder stage, stakeholder proof needs, and GTM workflow validation questions.',
    },
  },
  {
    slug: 'wallet-teams-simplifying-crypto-payments',
    reportNumber: 3,
    side: 'Buidler report',
    peopleClass: 'Wallet, payment, checkout, merchant, and transaction-flow teams',
    title: 'Wallet Teams Simplifying Crypto Payments',
    headline:
      'Wallet and payment teams are reducing transaction friction while preserving the controls higher-risk payment contexts require.',
    methods:
      'CipherPlay interviewed wallet, payment, checkout, merchant, and transaction-flow teams and treated adjacent developer, enterprise, ecosystem, and agent-payment signals as market context.',
    codedEvidence: '16 core coded project-need signals from 4 primary wallet/payment interviews.',
    work:
      'These teams are trying to complete transactions while balancing abstraction, custody, risk, gas, and user control.',
    serves: [
      {
        audience: 'Mainstream users and token buyers',
        outcome: 'Complete purchases without learning every crypto mechanic.',
      },
      {
        audience: 'Merchants and payment operators',
        outcome: 'Accept or route payments with custody, settlement, and risk controls.',
      },
      {
        audience: 'AI-agent builders',
        outcome: 'Payment rails that can be governed by spend and permission policies.',
      },
      {
        audience: 'Founders and launch teams',
        outcome: 'Reduced purchase abandonment and more reliable revenue or adoption.',
      },
    ],
    relatedSupport: [
      {
        label: 'Audit providers',
        support: 'Assurance around funds, custody, permissions, transaction risk, and payment logic.',
      },
      {
        label: 'AI-agent builders',
        support: 'Policy-controlled autonomous transaction use cases.',
      },
      {
        label: 'Regulated and creator-market operators',
        support: 'Asset purchase, settlement, custody, and usage-fee flows.',
      },
    ],
    overallSummary:
      'The shared job is to reduce abandonment and complexity without hiding the custody, settlement, refund, dispute, or permission boundaries that merchants, institutions, and agent operators need.',
    lockedGraph: {
      title: 'Self-Identified Project Needs',
      teaser:
        'The full report includes the coded payment-friction, utility, economics, and risk-control evidence view.',
      previewBars: graphPreviewBars,
    },
    lockedFurtherResearch: {
      title: 'Further Research',
      teaser:
        'The full report maps which payment contexts to research next and where abandonment should be measured.',
    },
  },
  {
    slug: 'ai-agent-builders-securing-autonomous-transactions',
    reportNumber: 4,
    side: 'Buidler report',
    peopleClass: 'AI-agent builders, agent-wallet builders, and agent-commerce operators',
    title: 'AI-Agent Builders Securing Autonomous Transactions',
    headline:
      'AI-agent builders need permissioned autonomy: agents can act only when identity, policy limits, evidence, and recourse are clear enough.',
    methods:
      'CipherPlay interviewed AI-agent builders, agent-wallet builders, and agent-commerce operators, with adjacent identity, outreach-agent, and hackathon-agent signals treated as market context.',
    codedEvidence: '13 core coded project-need signals from 4 primary AI-agent and agent-wallet interviews.',
    work:
      'AI-agent builders are trying to let agents act autonomously while keeping financial, identity, privacy, reputation, and dispute risk within acceptable bounds.',
    serves: [
      {
        audience: 'Agent owners',
        outcome: 'Delegated work and transactions without uncontrolled spend or misuse.',
      },
      {
        audience: 'Counterparties and merchants',
        outcome: 'Confidence that an agent is authorized, reputable, and accountable.',
      },
      {
        audience: 'Institutional adopters',
        outcome: 'Identity, validation, reputation, and recourse acceptable enough for sensitive workflows.',
      },
      {
        audience: 'Trust reviewers',
        outcome: 'Clear boundaries for wallet permissions, spend limits, proof, and disputes.',
      },
    ],
    relatedSupport: [
      {
        label: 'Wallet teams',
        support: 'Payment rails and wallet controls that can enforce agent policies.',
      },
      {
        label: 'Audit providers',
        support: 'Validation of spend limits, permissions, and autonomous-action boundaries.',
      },
      {
        label: 'Regulated operators',
        support: 'Adjacent privacy, identity, and compliance constraints.',
      },
    ],
    overallSummary:
      'The important pattern is permissioned autonomy: agents can act, spend, prove work, and represent an owner only when identity, policy limits, evidence, and recourse are clear enough for counterparties to rely on.',
    lockedGraph: {
      title: 'Self-Identified Project Needs',
      teaser:
        'The full report shows the evidence split between agent trust proof and unsafe-spend or recourse gaps.',
      previewBars: graphPreviewBars,
    },
    lockedFurtherResearch: {
      title: 'Further Research',
      teaser:
        'The full report defines transaction-volume, policy-envelope, proof, reputation, privacy, and recourse validation questions.',
    },
  },
  {
    slug: 'operators-monetizing-assets-under-trust-and-compliance-constraints',
    reportNumber: 5,
    side: 'Buidler report',
    peopleClass: 'Regulated-asset, creator-market, game, licensing, and asset-monetization operators',
    title: 'Operators Monetizing Assets Under Trust And Compliance Constraints',
    headline:
      'Asset operators use Web3 when ownership, transfer, provenance, payments, licensing, or auditability must become more reliable.',
    methods:
      'CipherPlay interviewed operators across regulated assets, creator markets, games, licensing, and asset monetization.',
    codedEvidence: '36 coded need signals from 9 included interviews.',
    work:
      'These operators are trying to monetize or transfer assets in ways buyers, regulators, creators, users, or platforms can trust.',
    serves: [
      {
        audience: 'Buyers, users, players, or collectors',
        outcome: 'Confidence that an asset can be owned, used, transferred, or monetized safely.',
      },
      {
        audience: 'Compliance reviewers and partners',
        outcome: 'Proof of identity, legality, custody, provenance, and auditability.',
      },
      {
        audience: 'Creators and rights holders',
        outcome: 'Licensing, usage fees, royalties, or durable monetization without losing control.',
      },
      {
        audience: 'Asset businesses',
        outcome: 'Revenue models that survive beyond one-time sales or speculative launches.',
      },
    ],
    relatedSupport: [
      {
        label: 'Wallet teams',
        support: 'Purchase, custody, settlement, and usage-fee flows.',
      },
      {
        label: 'Audit providers',
        support: 'Compliance, custody, audit trail, and asset-control proof.',
      },
      {
        label: 'GTM teams',
        support: 'Market education, buyer trust, and durable monetization support.',
      },
    ],
    overallSummary:
      'The shared job is to make asset monetization trustworthy enough for buyers, partners, regulators, creators, and platforms to act.',
    lockedGraph: {
      title: 'Self-Identified Project Needs',
      teaser:
        'The full report includes the coded evidence view across compliance, payments, GTM, economics, and build cost.',
      previewBars: graphPreviewBars,
    },
    lockedFurtherResearch: {
      title: 'Further Research',
      teaser:
        'The full report separates the next research wave by operator segment, production status, approval stakeholders, and cost thresholds.',
    },
  },
  {
    slug: 'blockchain-relations-teams-growing-ecosystem-adoption',
    reportNumber: 6,
    side: 'Provider report',
    peopleClass: 'DevRel, blockchain relations, ecosystem growth, grants, and builder-program teams',
    title: 'Blockchain Relations Teams Growing Ecosystem Adoption',
    headline:
      'Blockchain relations teams turn grants, support, incentives, and builder programs into durable adoption signals.',
    methods:
      'CipherPlay interviewed DevRel, blockchain relations, ecosystem growth, grants, and builder-program teams from across Web3.',
    codedEvidence: '34 coded need signals from 9 included interviews.',
    work:
      'These teams are trying to turn ecosystem support into retained builders, shipped apps, useful liquidity, users, revenue, transactions, ecosystem learning, or credible proof of momentum.',
    serves: [
      {
        audience: 'Developers',
        outcome: 'Faster onboarding, better docs/support, and a reason to build again.',
      },
      {
        audience: 'Founders and operators',
        outcome: 'Grants, support, users, and ecosystem credibility that convert into business proof.',
      },
      {
        audience: 'Chain and protocol stakeholders',
        outcome: 'Apps, users, liquidity, activity, and proof that funded work benefits the ecosystem.',
      },
      {
        audience: 'GTM and community teams',
        outcome: 'Credible builder wins and evidence of ecosystem momentum.',
      },
    ],
    relatedSupport: [
      {
        label: 'GTM teams',
        support: 'Market access and adoption support for builders after grants or hackathons.',
      },
      {
        label: 'Developers',
        support: 'The served buidler need around first-build friction and support.',
      },
      {
        label: 'Founders',
        support: 'The served buidler need around durable business outcomes.',
      },
    ],
    overallSummary:
      'Their work is valuable when it produces retained builders, shipped apps, useful liquidity, users, revenue, transactions, ecosystem learning, or credible proof of momentum.',
    lockedGraph: {
      title: 'Self-Identified Project Needs',
      teaser:
        'The full report shows the evidence view for activation, incentive retention, business support, infrastructure foundations, and specialized workflows.',
      previewBars: graphPreviewBars,
    },
    lockedFurtherResearch: {
      title: 'Further Research',
      teaser:
        'The full report defines the follow-up questions for program metrics, builder drop-off, incentive structures, and business support.',
    },
  },
  {
    slug: 'gtm-teams-building-credibility-and-pipeline',
    reportNumber: 7,
    side: 'Provider report',
    peopleClass: 'GTM, marketing, sales, PR, recruiting, and outreach teams',
    title: 'GTM Teams Building Credibility And Pipeline',
    headline:
      'GTM teams help builders earn attention, trust, and qualified pipeline in markets where technical claims are noisy.',
    methods:
      'CipherPlay interviewed GTM, marketing, sales, PR, recruiting, and outreach teams from across Web3.',
    codedEvidence: '35 coded need signals from 9 included interviews.',
    work:
      'GTM teams are helping builders reach the right audience with credible pipeline and narrative so awareness turns into a useful next step.',
    serves: [
      {
        audience: 'Founders and operators',
        outcome: 'Qualified pipeline, traction proof, investor narrative, and market feedback.',
      },
      {
        audience: 'Ecosystem teams',
        outcome: 'Builder wins, community momentum, and evidence that programs create adoption.',
      },
      {
        audience: 'Audit and security providers',
        outcome: 'Credibility, market education, and proof assets that help newer providers win trust.',
      },
      {
        audience: 'Technical teams',
        outcome: 'Clearer explanation of technical value to buyers, investors, or users.',
      },
    ],
    relatedSupport: [
      {
        label: 'Audit providers',
        support: 'Trust artifacts that can become PR, sales, and investor-facing credibility material.',
      },
      {
        label: 'Founders',
        support: 'The served buidler need around market proof and viability.',
      },
      {
        label: 'Blockchain relations teams',
        support: 'Adoption proof for ecosystem programs and builder wins.',
      },
    ],
    overallSummary:
      'The shared job is to match the right audience, proof asset, channel, narrative, and follow-up motion so awareness turns into a useful next step.',
    lockedGraph: {
      title: 'Self-Identified Project Needs',
      teaser:
        'The full report includes the coded evidence view behind pipeline, market access, builder support, and context fit.',
      previewBars: graphPreviewBars,
    },
    lockedFurtherResearch: {
      title: 'Further Research',
      teaser:
        'The full report breaks GTM questions down by function, buyer, success metric, credibility asset, channel, and repeatability.',
    },
  },
  {
    slug: 'audit-providers-helping-projects-prove-launch-readiness',
    reportNumber: 8,
    side: 'Provider report',
    peopleClass: 'Audit and Web3 security providers',
    title: 'Audit Providers Helping Projects Prove Launch Readiness',
    headline:
      'Audit providers package technical assurance into trust proof that customer teams can reuse for launch, fundraising, and partner confidence.',
    methods:
      'CipherPlay interviewed audit and Web3 security providers and treated adjacent trust-proof signals as market context.',
    codedEvidence: '8 provider-side coded need signals from 2 audit-provider interviews.',
    work:
      'Audit providers are trying to win trust in a reputation-led market while helping customer teams reassure investors, users, communities, and partners.',
    serves: [
      {
        audience: 'Developers and technical teams',
        outcome: 'Launch-critical code review and security assurance developers can act on.',
      },
      {
        audience: 'Founders and operators',
        outcome: 'Security proof that supports fundraising, launch readiness, and customer trust.',
      },
      {
        audience: 'GTM teams',
        outcome: 'Credible trust artifacts for PR, sales, investor narratives, and market education.',
      },
      {
        audience: 'Wallet, payment, agent, and regulated operators',
        outcome: 'Assurance around funds, custody, permissions, transaction risk, and asset-control readiness.',
      },
    ],
    relatedSupport: [
      {
        label: 'GTM teams',
        support: 'Credibility, positioning, and market education for audit providers.',
      },
      {
        label: 'Founders',
        support: 'The served buidler pressure around launch, funding, and trust proof.',
      },
      {
        label: 'Wallet and agent teams',
        support: 'High-risk workflows where audit proof may become more important.',
      },
    ],
    overallSummary:
      'The provider-side job is to win trust in a reputation-led market while turning security work into artifacts that buyers and their stakeholders understand.',
    lockedGraph: {
      title: 'Self-Identified Project Needs',
      teaser:
        'The full report includes the provider-side evidence view behind security proof, reputation, and delivery capacity.',
      previewBars: graphPreviewBars,
    },
    lockedFurtherResearch: {
      title: 'Further Research',
      teaser:
        'The full report defines the auditee buying-job questions, urgency triggers, provider-selection tradeoffs, and package-tier validation needs.',
    },
  },
];

export function getStateOfWeb3Report(slug: string): StateOfWeb3Report | undefined {
  return stateOfWeb3Reports.find((report) => report.slug === slug);
}

export function getAdjacentStateOfWeb3Reports(report: StateOfWeb3Report): {
  previous?: StateOfWeb3Report;
  next?: StateOfWeb3Report;
} {
  const index = stateOfWeb3Reports.findIndex((item) => item.slug === report.slug);

  return {
    previous: index > 0 ? stateOfWeb3Reports[index - 1] : undefined,
    next: index >= 0 && index < stateOfWeb3Reports.length - 1 ? stateOfWeb3Reports[index + 1] : undefined,
  };
}
