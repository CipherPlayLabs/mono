import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

export function HomeHero(): React.JSX.Element {
  const avatarUrl = useBaseUrl('/img/headshot.png');

  return (
    <section className={styles.hero}>
      <img
        src={avatarUrl}
        alt="Allan B. Pedin IV"
        className={styles.avatar}
      />
      <h1 className={styles.name}>Allan B. Pedin IV</h1>
      <p className={styles.tagline}>
        CEO | Redefining the Internet to be: Intelligent, Transparent, Inclusive, Decentralized | CEO & Co-Founder at CipherPlay & randao.net | Published AI & Blockchain Researcher
      </p>
      <div className={styles.buttons}>
        <Link to="/insights" className={styles.primaryButton}>
          Read Insights
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <Link to="/research" className={styles.secondaryButton}>
          View Research
        </Link>
      </div>
    </section>
  );
}
