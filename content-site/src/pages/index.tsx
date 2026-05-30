import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {ProductCard} from '@site/src/components/ProductCard';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {investorDiligence, products} from '@site/src/data/site';
import {links} from '../../links';
import styles from './index.module.css';

const primarySections = [
  {
    label: 'Company',
    title: 'About',
    summary: 'Leadership, TAP, backers, and partner ecosystem context.',
    href: '/about',
  },
  {
    label: 'Research',
    title: 'Market Research',
    summary: 'Public research and the Full Report request path.',
    href: '/market-analysis',
  },
  {
    label: 'Values',
    title: 'TAP',
    summary: 'Transparency, Authenticity, and Perspicacity guide how CipherPlay operates.',
    href: '/about/tap-into-success',
  },
  {
    label: 'Access',
    title: 'Partners',
    summary: 'Backer and partner ecosystem relationships that support collaboration.',
    href: '/partners',
  },
  {
    label: 'Leadership',
    title: 'Team',
    summary: 'CEO, CTO, and COO leadership across research, product, technology, and operations.',
    href: '/team',
  },
];

const proofLadder = [
  {
    label: 'Published Market Research',
    title: 'Public Market Research is available for review.',
    summary:
      'Review CipherPlay research posture, product ownership, team, backers, and ecosystem context from the public site.',
    href: '/market-analysis',
    action: 'Review Market Research',
  },
  {
    label: 'Product Execution',
    title: 'Research and product execution live in the same operating loop.',
    summary:
      'Market Research explains what CipherPlay sees; RANDAO and consulting capability show how the studio moves toward shipped software.',
    href: '/products',
    action: 'Review Products & Services',
  },
  {
    label: 'Opportunity Formation',
    title: 'Emerging-technology uncertainty becomes software opportunity.',
    summary:
      'CipherPlay uses public research, product work, and ecosystem relationships to identify where software can reduce uncertainty.',
    href: '/products/#consulting-services',
    action: 'Review Consulting Services',
  },
];

const audiencePaths = [
  {
    label: 'For investors',
    title: 'Investors',
    summary:
      'Start with the public company, research, product, team, backer, and partner context, then request the private materials when CipherPlay is relevant to your review.',
    href: links.investorForm,
    action: 'Request investor materials',
  },
  {
    label: 'For partners',
    title: 'Partners',
    summary:
      'Go to the Partners page when you want to explore research collaboration, product validation, ecosystem access, protocol work, pilots, or venture-support opportunities.',
    href: '/partners',
    action: 'Explore partnership options',
  },
  {
    label: 'For customers',
    title: 'Customers',
    summary:
      'Request consulting discovery when you need research-backed architecture, prototypes, integrations, or software execution for blockchain, AI, or Spatial Computing work.',
    href: links.customerForm,
    action: 'Request consulting discovery',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="CipherPlay"
      description="CipherPlay is an emerging-technology software studio and market research firm.">
      <main>
        <CipherHero
          eyebrow="Emerging-technology software studio"
          title="Research-backed software venture formation for emerging-digital markets."
          summary="CipherPlay connects public Market Research, product thesis development, technical execution, and ecosystem access for investors, partners, and customers."
          cta={investorDiligence.primaryCta}
          proofLabel="Start here"
          proofItems={[
            {label: 'Published Market Research', href: '/market-analysis'},
            {label: 'Proven Product Execution', href: '/products'},
            {label: 'TAP operating principles', href: '/about/tap-into-success'},
          ]}
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Start here</p>
              <h2>Begin with what CipherPlay has made public.</h2>
            </div>
            <div className={styles.proofGrid}>
              {proofLadder.map((proof, index) =>
                proof.href ? (
                  <TrackedLink
                    key={proof.label}
                    to={proof.href}
                    eventName="route_home_proof"
                    eventProps={{destination: proof.href}}
                    className={styles.proofCard}>
                    <span>{String(index + 1).padStart(2, '0')} / {proof.label}</span>
                    <h3>{proof.title}</h3>
                    <p>{proof.summary}</p>
                    <strong>{proof.action}</strong>
                  </TrackedLink>
                ) : (
                  <article className={styles.proofCard} key={proof.label}>
                    <span>{String(index + 1).padStart(2, '0')} / {proof.label}</span>
                    <h3>{proof.title}</h3>
                    <p>{proof.summary}</p>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section className={styles.band}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Choose your next step</p>
              <h2>Start where your relationship to CipherPlay begins.</h2>
            </div>
            <div className={styles.audienceGrid}>
              {audiencePaths.map((path) => (
                <TrackedLink
                  key={path.title}
                  to={path.href}
                  eventName="route_home_audience"
                  eventProps={{destination: path.title.toLowerCase()}}
                  className={styles.audienceCard}>
                  <span>{path.label}</span>
                  <h3>{path.title}</h3>
                  <p>{path.summary}</p>
                  <strong>{path.action}</strong>
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.twoColumn}>
              <div>
                <p className={styles.eyebrow}>Product spotlight</p>
                <h2>RANDAO turns cryptographic infrastructure research into a live product.</h2>
                <p>
                  CipherPlay owns and operates RANDAO, a decentralized and verifiable randomness
                  product for blockchain and cryptographic infrastructure. It is one public example
                  of how the studio moves from research-backed thesis work to shipped software.
                </p>
                <Link to="/products/randao" className={styles.textLink}>
                  View RANDAO
                </Link>
              </div>
              <div className={styles.productList}>
                {products.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.band}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Explore CipherPlay</p>
              <h2>Continue with the pages that answer your next question.</h2>
            </div>
            <div className={styles.sectionGrid}>
              {primarySections.map((section) => (
                <TrackedLink
                  key={section.href}
                  to={section.href}
                  eventName="route_home_section"
                  eventProps={{destination: section.href}}
                  className={styles.sectionCard}>
                  <span>{section.label}</span>
                  <h3>{section.title}</h3>
                  <p>{section.summary}</p>
                </TrackedLink>
              ))}
            </div>
            <div className={styles.investorPanel}>
              <div>
                <p className={styles.eyebrow}>Investor materials</p>
                <h2>Request the private investor materials.</h2>
                <p>
                  After reviewing the public pages, use CipherPlay's hosted request flow for the
                  private investor materials.
                </p>
              </div>
              <ConversionButton cta={investorDiligence.primaryCta} />
            </div>
          </div>
        </section>

        <CredibilityStrip />
      </main>
    </Layout>
  );
}
