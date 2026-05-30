import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {ProductCard} from '@site/src/components/ProductCard';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {products} from '@site/src/data/site';
import styles from './index.module.css';

const primarySections = [
  {
    label: 'Company',
    title: 'About',
    summary: 'Company overview, leadership, backers, partner ecosystem, and diligence signals.',
    href: '/about',
  },
  {
    label: 'Reports',
    title: 'Market Research',
    summary: 'Public Market Research surface and Full Report request path.',
    href: '/market-analysis',
  },
  {
    label: 'Software',
    title: 'Products & Services',
    summary: 'Current blockchain infrastructure product work, consulting services, and historic product history.',
    href: '/products',
  },
  {
    label: 'Ecosystem',
    title: 'Partners',
    summary: 'Partnerships, collaboration signals, and CipherPlay LinkedIn.',
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
      description="CipherPlay is an emerging-technology software studio and market research firm.">
      <main>
        <CipherHero
          eyebrow="Emerging-technology software and market research"
          title="CipherPlay"
          summary="An emerging-technology software studio and market research firm building products and public research for investors, partners, and customers."
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Site sections</p>
              <h2>Explore CipherPlay company, research, products and services, partners, and media.</h2>
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
                  studio and research surfaces stay focused on reviewable material.
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

        <CredibilityStrip />
      </main>
    </Layout>
  );
}
