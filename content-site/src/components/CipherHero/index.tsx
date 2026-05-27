import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {ConversionButton} from '@site/src/components/ConversionButton';
import type {SiteCta} from '@site/src/data/site';
import styles from './styles.module.css';

interface CipherHeroProps {
  eyebrow?: string;
  title: string;
  summary: string;
  cta?: SiteCta;
  imageSrc?: string;
}

export function CipherHero({
  eyebrow,
  title,
  summary,
  cta,
  imageSrc = '/img/cipherplay/social-card.jpg',
}: CipherHeroProps): React.JSX.Element {
  const heroImage = useBaseUrl(imageSrc);

  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h1>{title}</h1>
            <p className={styles.summary}>{summary}</p>
            {cta && <ConversionButton cta={cta} />}
          </div>
          <img className={styles.brandImage} src={heroImage} alt="" />
        </div>
      </div>
    </section>
  );
}
