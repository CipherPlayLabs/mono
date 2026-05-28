import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {ProductCard} from '@site/src/components/ProductCard';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {
  industryPillars,
  marketResearchReports,
  products,
} from '@site/src/data/site';
import styles from './index.module.css';

const primarySections = [
  {
    label: 'Company context',
    title: 'About',
    summary: 'Company overview, leadership, backers, partner ecosystem, and diligence context.',
    href: '/about',
  },
  {
    label: 'Reports',
    title: 'Market Research',
    summary: 'Public Market Research reports with full-report email requests through forms.',
    href: '/market-analysis',
  },
  {
    label: 'Software',
    title: 'Products & Services',
    summary: 'Current blockchain infrastructure product work, consulting services, and historic context.',
    href: '/products',
  },
  {
    label: 'Ecosystem',
    title: 'Partners',
    summary: 'Partnership context, collaboration signals, and CipherPlay LinkedIn.',
    href: '/partners',
  },
  {
    label: 'Brand',
    title: 'Media Kit',
    summary: 'Approved logos, banners, downloads, and public brand assets.',
    href: '/media-kit',
  },
];

export default function Home(): ReactNode {
  return (
    <Layout
      title="CipherPlay"
      description="CipherPlay is a venture-backed emerging-tech software development studio and market research firm.">
      <main>
        <CipherHero
          eyebrow="Emerging-tech software and market intelligence"
          title="CipherPlay"
          summary="A venture-backed emerging-tech software development studio and market research firm building products and public research for investors, partners, and customers."
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Site sections</p>
              <h2>Explore company, research, products and services, partner, and media context.</h2>
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
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.twoColumn}>
              <div>
                <p className={styles.eyebrow}>Blockchain infrastructure</p>
                <h2>RANDAO anchors CipherPlay's cryptographic software work.</h2>
                <p>
                  RANDAO gives the site a public blockchain infrastructure anchor while the broader
                  studio and research surfaces stay focused on reviewable context.
                </p>
                <Link to="/products/randao" className={styles.textLink}>
                  View RANDAO product page
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
              <p>Market Research reports</p>
              <h2>Useful public reports with full-report email requests through forms.</h2>
            </div>
            <div className={styles.reportGrid}>
              {marketResearchReports.map((report) => (
                <TrackedLink
                  key={report.slug}
                  to={report.href}
                  eventName="market_analysis_teaser_click"
                  eventProps={{report: report.slug}}
                  className={styles.report}>
                  <span>{report.industries.join(' / ')}</span>
                  <h3>{report.title}</h3>
                  <p>{report.executiveSummary}</p>
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Industry pillars</p>
              <h2>Focused where emerging technology becomes software, infrastructure, and intelligence.</h2>
            </div>
            <div className={styles.pillarGrid}>
              {industryPillars.map((pillar) => (
                <article className={styles.pillar} key={pillar.name}>
                  <h3>{pillar.name}</h3>
                  <p>{pillar.summary}</p>
                  <Link to={pillar.contextHref}>Explore context</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <CredibilityStrip />
      </main>
    </Layout>
  );
}
