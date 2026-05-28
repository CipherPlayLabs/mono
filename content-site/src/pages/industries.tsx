import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {industryPillars} from '@site/src/data/site';
import styles from './industries.module.css';

export default function Industries(): ReactNode {
  return (
    <Layout
      title="Industries"
      description="CipherPlay industry pillars across AI, Web3, cryptographic protocols, venture intelligence, and research software.">
      <main>
        <CipherHero
          eyebrow="Industries"
          title="Five pillars for emerging-technology software and intelligence."
          summary="CipherPlay keeps its public industry map focused on areas where research, product execution, and market intelligence reinforce each other."
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.grid}>
              {industryPillars.map((pillar) => (
                <article className={styles.pillar} key={pillar.name}>
                  <h2>{pillar.name}</h2>
                  <p>{pillar.summary}</p>
                  <p className={styles.audienceFit}>{pillar.audienceFit}</p>
                  <Link to={pillar.contextHref}>Explore related context</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
