import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {AudienceCardGrid} from '@site/src/components/AudienceCardGrid';
import {CipherHero} from '@site/src/components/CipherHero';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {ProductCard} from '@site/src/components/ProductCard';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {
  industryPillars,
  marketAnalysisTeasers,
  products,
} from '@site/src/data/site';
import styles from './index.module.css';

export default function Home(): ReactNode {
  return (
    <Layout
      title="CipherPlay"
      description="CipherPlay is a venture-backed emerging-tech software development studio and market research firm.">
      <main>
        <CipherHero
          eyebrow="Emerging-tech software and market intelligence"
          title="CipherPlay"
          summary="A venture-backed emerging-tech software development studio and market research firm building products and public research for investors, analysts, partners, and customers."
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Choose your path</p>
              <h2>Get to the right CipherPlay context quickly.</h2>
            </div>
            <AudienceCardGrid />
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.twoColumn}>
              <div>
                <p className={styles.eyebrow}>First product proof</p>
                <h2>Randao anchors CipherPlay's cryptographic software work.</h2>
                <p>
                  Randao gives the site an immediate product proof point while the broader
                  studio and research surfaces stay focused on public, reviewable context.
                </p>
                <Link to="/products/randao" className={styles.textLink}>
                  View Randao product page
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
              <p>Market analysis</p>
              <h2>Public teasers, private full reports when request links are ready.</h2>
            </div>
            <div className={styles.teaserGrid}>
              {marketAnalysisTeasers.map((teaser) => (
                <TrackedLink
                  key={teaser.slug}
                  to="/market-analysis"
                  eventName="market_analysis_teaser_click"
                  eventProps={{teaser: teaser.slug}}
                  className={styles.teaser}>
                  <span>{teaser.industries.join(' / ')}</span>
                  <h3>{teaser.title}</h3>
                  <p>{teaser.executiveSummary}</p>
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
                  <Link to={pillar.proofHref}>See proof</Link>
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
