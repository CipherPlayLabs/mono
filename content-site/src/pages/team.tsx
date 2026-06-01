import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {TeamGrid} from '@site/src/components/TeamGrid';
import styles from './team.module.css';

const leadershipSignals = [
  'Research and company strategy',
  'Technical architecture and software execution',
  'Operating cadence and coordination',
];

export default function Team(): ReactNode {
  return (
    <Layout title="Team" description="CipherPlay leadership team.">
      <main>
        <CipherHero
          eyebrow="Team"
          title="Leadership for research, product, technology, and execution."
          summary="The public Team page shows CipherPlay leadership only: CEO Allan B. Pedin IV, CTO Tyler Warburton, and COO Alex Posey."
          proofLabel="Leadership"
          proofItems={leadershipSignals}
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Leadership</p>
              <h2>Research, product, and operating leadership for the studio.</h2>
            </div>
            <div className={styles.signalGrid}>
              {leadershipSignals.map((signal) => (
                <article className={styles.signalCard} key={signal}>
                  <span>{signal}</span>
                </article>
              ))}
            </div>
            <TeamGrid />
          </div>
        </section>
        <CredibilityStrip />
      </main>
    </Layout>
  );
}
