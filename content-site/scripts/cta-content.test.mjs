import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {test} from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const exists = (path) => existsSync(new URL(`../${path}`, import.meta.url));

test('conversion copy uses lower-friction action labels', () => {
  const siteData = read('src/data/site.ts');

  assert.match(siteData, /label: 'Get investor materials'/);
  assert.match(siteData, /label: 'Propose a partnership'/);
  assert.match(siteData, /label: 'Schedule a RANDAO demo'/);
  assert.match(siteData, /label: 'Start consulting discovery'/);
});

test('home hero segments the first CTA moment by audience', () => {
  const homePage = read('src/pages/index.tsx');

  assert.match(homePage, /const heroAudienceCtas = \[/);
  assert.match(homePage, /ctaList=\{heroAudienceCtas\}/);
  assert.match(homePage, /For investors/);
  assert.match(homePage, /For partners/);
  assert.match(homePage, /For customers/);
});

test('products page is product-only and links to consulting separately', () => {
  const productsPage = read('src/pages/products/index.tsx');

  assert.doesNotMatch(productsPage, /serviceOfferings/);
  assert.doesNotMatch(productsPage, /Start consulting discovery/);
  assert.match(productsPage, /title="Products"/);
  assert.match(productsPage, /to="\/consulting"/);
});

test('consulting page owns the consulting CTA and service proof', () => {
  assert.equal(exists('src/pages/consulting.tsx'), true);

  const consultingPage = read('src/pages/consulting.tsx');

  assert.match(consultingPage, /title="Consulting"/);
  assert.match(consultingPage, /const consulting = serviceOfferings\[0\];/);
  assert.match(consultingPage, /cta=\{consulting\.cta\}/);
  assert.match(consultingPage, /eventProps=\{\{page: 'consulting'/);
  assert.match(consultingPage, /Blockchain infrastructure/);
  assert.match(consultingPage, /AI systems and workflows/);
  assert.match(consultingPage, /Spatial Computing software and interfaces/);
});

test('consulting page speaks to service buyers across emerging tech and IT needs', () => {
  const consultingPage = read('src/pages/consulting.tsx');
  const siteData = read('src/data/site.ts');

  assert.match(consultingPage, /Emerging Digital Technology & IT Consulting Services/);
  assert.match(consultingPage, /const consultingFit = \[/);
  assert.match(consultingPage, /Blockchain/);
  assert.match(consultingPage, /AI/);
  assert.match(consultingPage, /Spatial Computing/);
  assert.match(consultingPage, /IT/);
  assert.match(consultingPage, /Web/);
  assert.match(consultingPage, /E-commerce/);
  assert.match(consultingPage, /Market Validation/);
  assert.match(consultingPage, /What we help with/);
  assert.match(consultingPage, /Business teams/);
  assert.match(siteData, /IT systems and workflows/);
  assert.match(siteData, /Web and e-commerce implementation/);
  assert.match(siteData, /Market validation/);
});

test('consulting page ends on discovery instead of product proof', () => {
  const consultingPage = read('src/pages/consulting.tsx');

  assert.match(consultingPage, /placement: 'discovery-panel'/);
  assert.doesNotMatch(consultingPage, /Execution proof/);
  assert.doesNotMatch(consultingPage, /Review CipherPlay products/);
  assert.doesNotMatch(consultingPage, /ProductCard/);
});

test('about TAP copy builds trust through verifiable specifics', () => {
  const aboutPage = read('src/pages/about.tsx');
  const siteData = read('src/data/site.ts');

  assert.match(aboutPage, /We publish what we know, show what we are building/);
  assert.match(aboutPage, /compare those claims against our\s+work/);
  assert.match(aboutPage, /We keep claims tied to shipped work, public materials, and observable decisions/);
  assert.match(siteData, /TAP keeps CipherPlay claims verifiable/);
  assert.doesNotMatch(aboutPage, /At CipherPlay, TAP means/);
  assert.doesNotMatch(aboutPage, /perfect information game/);
  assert.doesNotMatch(siteData, /builds trust/);
});

test('product cards use a balanced footer action layout', () => {
  const productCard = read('src/components/ProductCard/index.tsx');
  const productCardCss = read('src/components/ProductCard/styles.module.css');

  assert.match(productCard, /className=\{styles\.status\}/);
  assert.match(productCard, /className=\{styles\.secondaryAction\}/);
  assert.match(productCard, /className=\{styles\.primaryAction\}/);
  assert.doesNotMatch(productCardCss, /\.card span/);
  assert.match(productCardCss, /\.status/);
  assert.match(productCardCss, /grid-template-columns: minmax\(0, 1fr\) minmax\(16rem, 25rem\)/);
  assert.match(productCardCss, /border-top: 1px solid var\(--cipher-border\)/);
  assert.match(productCardCss, /justify-self: end/);
});

test('navigation exposes products and consulting as separate surfaces', () => {
  const config = read('docusaurus.config.ts');
  const homePage = read('src/pages/index.tsx');

  assert.match(config, /to: '\/products',\s+label: 'Products'/);
  assert.match(config, /to: '\/consulting',\s+label: 'Consulting'/);
  assert.match(homePage, /href: '\/consulting'/);
  assert.doesNotMatch(homePage, /\/products\/#consulting-services/);
});

test('conversion buttons send placement metadata to Plausible', () => {
  const button = read('src/components/ConversionButton/index.tsx');

  assert.match(button, /eventProps\?:/);
  assert.match(button, /const eventOptions = \{props: analyticsProps\};/);
  assert.match(button, /window\.plausible\?\.\(cta\.eventName, eventOptions\)/);
});

test('navbar CTA remains available in the mobile menu', () => {
  const config = read('docusaurus.config.ts');
  const css = read('src/css/custom.css');

  assert.match(config, /href: links\.investorForm,\s+label: 'Request Investor Materials'/);
  assert.match(css, /border: 1px solid rgba\(55, 255, 222, 0\.48\)/);
  assert.match(css, /background: rgba\(55, 255, 222, 0\.08\)/);
  assert.match(css, /\.navbar__items--right > \.navbar-investor-cta/);
  assert.match(css, /\.navbar__items--right > \.navbar-investor-cta\s*\{\s*display: none;/);
  assert.match(css, /\.navbar-sidebar\s+\.navbar-investor-cta/);
});

test('market analysis promotes reading State of Web3 before requesting the report', () => {
  const marketPage = read('src/pages/market-analysis.tsx');
  const links = read('links.ts');

  assert.match(links, /reportRequestForm: 'https:\/\/forms\.cipherplay\.net\/form\/state-of-web3'/);
  assert.match(marketPage, /label: 'Read State of Web3'/);
  assert.match(marketPage, /href: '\/market-analysis\/state-of-web3'/);
  assert.match(marketPage, /State Of Web3/);
  assert.match(marketPage, /Identify Market Opportunities/);
  assert.match(marketPage, /Buyer Decision Making/);
  assert.doesNotMatch(marketPage, /'People-Class Reports',/);
  assert.doesNotMatch(marketPage, /'Full Report request path',/);
  assert.doesNotMatch(marketPage, /label: 'Request full report'/);
});

test('State of Web3 gated copy sells decision value instead of form mechanics', () => {
  const stateData = read('src/data/stateOfWeb3.ts');
  const aggregatePage = read('src/components/StateOfWeb3AggregatePage/index.tsx');
  const reportPage = read('src/components/StateOfWeb3ReportPage/index.tsx');
  const publicCopy = [stateData, aggregatePage, reportPage].join('\n');

  assert.doesNotMatch(publicCopy, /n8n/i);
  assert.doesNotMatch(publicCopy, /emails? the full PDF/i);
  assert.doesNotMatch(publicCopy, /request context/i);
  assert.doesNotMatch(publicCopy, /delivered through the State Of Web3 form/i);
  assert.match(publicCopy, /complete evidence pack/i);
  assert.match(publicCopy, /decisions that need more certainty/i);
});

test('State of Web3 aggregate uses compact overview cards and type-specific report actions', () => {
  const aggregatePage = read('src/components/StateOfWeb3AggregatePage/index.tsx');
  const aggregateCss = read('src/components/StateOfWeb3AggregatePage/styles.module.css');

  assert.match(aggregatePage, /const reportActionLabel = report\.side === 'Buidler report'/);
  assert.match(aggregatePage, /'Read Buidl report'/);
  assert.match(aggregatePage, /'Read Provider report'/);
  assert.doesNotMatch(aggregatePage, /Read People-Class Report/);
  assert.match(aggregatePage, /styles\.overviewSection/);
  assert.match(aggregateCss, /\.overviewSection/);
  assert.match(aggregateCss, /min-height: 0;/);
  assert.doesNotMatch(aggregateCss, /min-height: 230px;/);
  assert.match(aggregateCss, /@media \(max-width: 760px\) \{\n  \.summaryGrid/);
  assert.doesNotMatch(aggregateCss, /@media \(max-width: 996px\) \{\n  \.summaryGrid,/);
});

test('State of Web3 aggregate and people-class report routes exist', () => {
  const stateData = read('src/data/stateOfWeb3.ts');

  assert.equal(exists('src/pages/market-analysis/state-of-web3/index.tsx'), true);
  assert.equal(exists('src/pages/market-analysis/state-of-web3/developers-building-on-new-chains.tsx'), true);
  assert.equal(exists('src/pages/market-analysis/state-of-web3/founders-proving-business-viability.tsx'), true);
  assert.equal(exists('src/pages/market-analysis/state-of-web3/wallet-teams-simplifying-crypto-payments.tsx'), true);
  assert.equal(exists('src/pages/market-analysis/state-of-web3/ai-agent-builders-securing-autonomous-transactions.tsx'), true);
  assert.equal(exists('src/pages/market-analysis/state-of-web3/operators-monetizing-assets-under-trust-and-compliance-constraints.tsx'), true);
  assert.equal(exists('src/pages/market-analysis/state-of-web3/blockchain-relations-teams-growing-ecosystem-adoption.tsx'), true);
  assert.equal(exists('src/pages/market-analysis/state-of-web3/gtm-teams-building-credibility-and-pipeline.tsx'), true);
  assert.equal(exists('src/pages/market-analysis/state-of-web3/audit-providers-helping-projects-prove-launch-readiness.tsx'), true);
  assert.match(stateData, /export const stateOfWeb3Reports/);
  assert.match(stateData, /state-of-web3/);
  assert.match(stateData, /People-Class Report/);
  assert.match(stateData, /links\.reportRequestForm/);
});

test('State of Web3 subreports use reader-facing evidence language and parent links', () => {
  const stateData = read('src/data/stateOfWeb3.ts');
  const reportPage = read('src/components/StateOfWeb3ReportPage/index.tsx');

  assert.match(stateData, /40 coded need signals from 10 included interviews/);
  assert.match(stateData, /core coded project-need signals from 4 primary/);
  assert.doesNotMatch(stateData, /coded .* rows/);
  assert.match(reportPage, /Back to State Of Web3/);
  assert.match(reportPage, /to="\/market-analysis\/state-of-web3"/);
  assert.doesNotMatch(reportPage, /State Of Web3 aggregate/);
  assert.doesNotMatch(reportPage, /Criterion rows/);
});

test('State of Web3 report pages gate high-value graph and further research sections', () => {
  const reportPage = read('src/components/StateOfWeb3ReportPage/index.tsx');
  const reportCss = read('src/components/StateOfWeb3ReportPage/styles.module.css');

  assert.match(reportPage, /lockedGraph/);
  assert.match(reportPage, /lockedFurtherResearch/);
  assert.match(reportPage, /When the public signal matches your decision/);
  assert.match(reportPage, /get the complete report for the chart/);
  assert.match(reportCss, /filter: blur/);
  assert.match(reportCss, /pointer-events: none/);
});
