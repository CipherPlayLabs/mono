import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {ConversionButton} from '@site/src/components/ConversionButton';
import type {SiteCta} from '@site/src/data/site';
import styles from './styles.module.css';

type ProofItem = string | {label: string; href: string};
type HeroCtaItem = {
  audience: string;
  cta: SiteCta;
  proof?: string;
  eventProps?: Record<string, string>;
};

interface CipherHeroProps {
  eyebrow?: string;
  title: string;
  summary: string;
  cta?: SiteCta;
  ctaEventProps?: Record<string, string>;
  ctaList?: HeroCtaItem[];
  proofLabel?: string;
  proofItems?: ProofItem[];
}

const defaultProofItems = [
  'Public Market Research',
  'RANDAO product ownership',
  'TAP trust architecture',
];

export function CipherHero({
  eyebrow,
  title,
  summary,
  cta,
  ctaEventProps,
  ctaList,
  proofLabel = 'At a glance',
  proofItems = defaultProofItems,
}: CipherHeroProps): React.JSX.Element {
  const brandMark = useBaseUrl('/img/cipherplay/logo-gradient.svg');

  return (
    <section className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h1>{title}</h1>
            <p className={styles.summary}>{summary}</p>
            {ctaList ? (
              <div className={styles.ctaList}>
                {ctaList.map((item) => (
                  <div className={styles.ctaCard} key={item.audience}>
                    <span className={styles.ctaAudience}>{item.audience}</span>
                    <ConversionButton
                      cta={item.cta}
                      proof={item.proof}
                      eventProps={{placement: 'hero', audience: item.audience, ...item.eventProps}}
                    />
                  </div>
                ))}
              </div>
            ) : (
              cta && <ConversionButton cta={cta} eventProps={ctaEventProps} />
            )}
          </div>
          <aside className={styles.proofPanel} aria-label={proofLabel}>
            <img className={styles.panelMark} src={brandMark} alt="" />
            <p>{proofLabel}</p>
            <ul>
              {proofItems.map((item) => {
                const label = typeof item === 'string' ? item : item.label;
                const href = typeof item === 'string' ? undefined : item.href;

                return (
                  <li className={href ? styles.linkItem : undefined} key={label}>
                    {href ? <Link to={href}>{label}</Link> : label}
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
