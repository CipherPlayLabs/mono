import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {TeamGrid} from '@site/src/components/TeamGrid';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {audiencePages} from '@site/src/data/site';
import styles from './about.module.css';

const investorContext = audiencePages.find((page) => page.slug === 'investors')!;

export default function About(): ReactNode {
  return (
    <Layout
      title="About"
      description="Company context, leadership, product proof, backers, and diligence information for CipherPlay.">
      <main>
        <CipherHero
          eyebrow="About CipherPlay"
          title="A venture-backed studio for emerging-tech software and market intelligence."
          summary="CipherPlay connects research, product thesis development, and software execution across AI, cryptographic infrastructure, and venture intelligence."
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.aboutGrid}>
              <article className={styles.panel}>
                <p className={styles.eyebrow}>Company context</p>
                <h2>Research-backed product building.</h2>
                <p>
                  CipherPlay uses public market research and focused product proof to make
                  emerging-technology opportunities easier to evaluate. RANDAO anchors the
                  current product portfolio, while the research pages show the markets and
                  technical domains the studio is tracking.
                </p>
              </article>

              <article className={styles.panel}>
                <p className={styles.eyebrow}>Investor diligence</p>
                <h2>Signals for company review.</h2>
                <ul className={styles.proofList}>
                  {investorContext.proofPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <ConversionButton cta={investorContext.primaryCta} />
              </article>
            </div>
          </div>
        </section>

        <section className={styles.band}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Review next</p>
              <h2>Company, product, and research context in one place.</h2>
            </div>
            <div className={styles.linkGrid}>
              <TrackedLink
                to="/products/randao"
                eventName="route_about_context"
                eventProps={{destination: 'randao'}}
                className={styles.linkCard}>
                <span>Product proof</span>
                <strong>RANDAO</strong>
              </TrackedLink>
              <TrackedLink
                to="/market-analysis"
                eventName="route_about_context"
                eventProps={{destination: 'market-research'}}
                className={styles.linkCard}>
                <span>Market intelligence</span>
                <strong>Market Research</strong>
              </TrackedLink>
              <TrackedLink
                to="/industries"
                eventName="route_about_context"
                eventProps={{destination: 'industries'}}
                className={styles.linkCard}>
                <span>Focus areas</span>
                <strong>Industry pillars</strong>
              </TrackedLink>
              <TrackedLink
                to="/partners"
                eventName="route_about_context"
                eventProps={{destination: 'partners'}}
                className={styles.linkCard}>
                <span>Ecosystem</span>
                <strong>Partners</strong>
              </TrackedLink>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Leadership</p>
              <h2>The team behind CipherPlay.</h2>
            </div>
            <TeamGrid />
            <Link className={styles.textLink} to="/team">
              View team page
            </Link>
          </div>
        </section>

        <CredibilityStrip />
      </main>
    </Layout>
  );
}
