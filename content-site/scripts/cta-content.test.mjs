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
  const css = read('src/css/custom.css');

  assert.match(css, /\.navbar__items--right > \.navbar-investor-cta/);
  assert.match(css, /\.navbar__items--right > \.navbar-investor-cta\s*\{\s*display: none;/);
  assert.match(css, /\.navbar-sidebar\s+\.navbar-investor-cta/);
});
