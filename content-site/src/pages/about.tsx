import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {TeamGrid} from '@site/src/components/TeamGrid';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {investorDiligence} from '@site/src/data/site';
import styles from './about.module.css';

const tapValues = [
  {
    name: 'Transparency',
    summary:
      'We show the markets we research and the products we build so investors, partners, and customers can move closer to a perfect information game with us.',
  },
  {
    name: 'Authenticity',
    summary:
      'We make sure our actions reinforce our words, our products do what we say they do, and our market claims match what we observe.',
  },
  {
    name: 'Perspicacity',
    summary:
      'We turn abundant market information into clear, actionable insight, giving CipherPlay an edge as a long-term ally.',
  },
];

export default function About(): ReactNode {
  return (
    <Layout
      title="About"
      description="Company overview, leadership, RANDAO, backers, and investor information for CipherPlay.">
      <main>
        <CipherHero
          eyebrow="About CipherPlay"
          title="A research-backed studio built to make emerging-technology opportunities easier to understand."
          summary="CipherPlay connects Market Research, product thesis development, infrastructure/software consulting, and ecosystem access across AI, cryptographic infrastructure, Spatial Computing, and venture intelligence."
          cta={investorDiligence.primaryCta}
          proofLabel="Company Snapshot"
          proofItems={[
            'Leadership across research, product, and operations',
            'Backers and partner ecosystem',
            'Company Values: TAP',
          ]}
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.aboutGrid}>
              <article className={styles.panel}>
                <p className={styles.eyebrow}>Company</p>
                <h2>Look before you invest.</h2>
                <p>
                  CipherPlay commits meaningful research and operating resources to understanding
                  emerging digital markets before accepting investor capital to execute a product
                  thesis.
                </p>
                <p>
                  That upfront work helps de-risk resource allocation for investors, partners, and
                  CipherPlay before product execution begins.
                </p>
              </article>

              <article className={styles.panel}>
                <p className={styles.eyebrow}>For investors</p>
                <h2>Review the company through public facts.</h2>
                <ul className={styles.signalList}>
                  {investorDiligence.signals.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <ConversionButton cta={investorDiligence.primaryCta} />
              </article>
            </div>
          </div>
        </section>

        <section className={styles.band}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>TAP</p>
              <h2>Transparency, Authenticity, and Perspicacity guide how CipherPlay operates.</h2>
            </div>
            <p className={styles.sectionIntro}>
              At CipherPlay, TAP means Transparency, Authenticity, and Perspicacity. The public
              site shows enough context to evaluate the company, keeps claims aligned with
              observable behavior, and turns market information into useful insight.
            </p>
            <div className={styles.valuesGrid}>
              {tapValues.map((value) => (
                <article className={styles.valueCard} key={value.name}>
                  <h3>{value.name}</h3>
                  <p>{value.summary}</p>
                </article>
              ))}
            </div>
            <TrackedLink
              to="/about/tap-into-success"
              eventName="route_about_context"
              eventProps={{destination: 'tap-values'}}
              className={styles.textLink}>
              Read the TAP operating principle
            </TrackedLink>
          </div>
        </section>

        <section className={styles.band}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <p>Review next</p>
              <h2>Company, product, research, and ecosystem in one place.</h2>
            </div>
            <div className={styles.linkGrid}>
              <TrackedLink
                to="/products/randao"
                eventName="route_about_context"
                eventProps={{destination: 'randao'}}
                className={styles.linkCard}>
                <span>Blockchain infrastructure</span>
                <strong>RANDAO</strong>
              </TrackedLink>
              <TrackedLink
                to="/market-analysis"
                eventName="route_about_context"
                eventProps={{destination: 'market-research'}}
                className={styles.linkCard}>
                <span>Research</span>
                <strong>Market Research</strong>
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
              <h2>Leadership across research, product, technology, and operations.</h2>
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
