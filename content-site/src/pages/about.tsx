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
      description="Company overview, leadership, RANDAO, backers, and diligence information for CipherPlay.">
      <main>
        <CipherHero
          eyebrow="About CipherPlay"
          title="An emerging-technology software studio and market research firm."
          summary="CipherPlay connects research, product thesis development, and software execution across AI, cryptographic infrastructure, and venture intelligence."
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.aboutGrid}>
              <article className={styles.panel}>
                <p className={styles.eyebrow}>Company</p>
                <h2>Research-backed product building.</h2>
                <p>
                  CipherPlay conducts detailed product research to make emerging-technology
                  opportunities easier to evaluate. RANDAO anchors the current product portfolio,
                  while the research pages show the markets and technical domains the studio is
                  tracking.
                </p>
              </article>

              <article className={styles.panel}>
                <p className={styles.eyebrow}>Investor diligence</p>
                <h2>Signals for company review.</h2>
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
              <p>Values</p>
              <h2>Tap into success.</h2>
            </div>
            <p className={styles.sectionIntro}>
              At CipherPlay, TAP means Transparency, Authenticity, and Perspicacity. We operate a
              game-theoretically optimized business model, and these core values define our
              strategy.
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
              <h2>Company, product, and research in one place.</h2>
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
                <span>Market intelligence</span>
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
