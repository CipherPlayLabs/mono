import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {marketAnalysisTeasers} from '@site/src/data/site';
import styles from './market-analysis.module.css';

export default function MarketAnalysis(): ReactNode {
  return (
    <Layout
      title="Market Analysis"
      description="Public CipherPlay market analysis teasers for emerging technology.">
      <main>
        <CipherHero
          eyebrow="Market analysis"
          title="Public research previews for emerging-technology decisions."
          summary="CipherPlay publishes public teasers that summarize market framing without exposing full private reports or go-to-market details."
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Report teasers</p>
              <h2>Full reports will be request-gated when external form URLs are ready.</h2>
            </div>
            <div className={styles.teaserGrid}>
              {marketAnalysisTeasers.map((teaser) => (
                <article className={styles.teaser} key={teaser.slug}>
                  <div>
                    <div className={styles.tags}>
                      {teaser.industries.map((industry) => (
                        <span key={industry}>{industry}</span>
                      ))}
                    </div>
                    <h2>{teaser.title}</h2>
                    <p>{teaser.executiveSummary}</p>
                  </div>
                  <ConversionButton cta={teaser.cta} />
                </article>
              ))}
            </div>
            <p className={styles.note}>
              These pages intentionally show public executive summaries only. Full private
              reports are not committed to the public content site.
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
