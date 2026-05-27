import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {audiencePages} from '@site/src/data/site';
import styles from './audiencePage.module.css';

const audience = audiencePages.find((page) => page.slug === 'analysts')!;

export default function Analysts(): ReactNode {
  return (
    <Layout title="Analysts" description={audience.summary}>
      <main className={styles.page}>
        <CipherHero
          eyebrow={audience.eyebrow}
          title={audience.title}
          summary={audience.summary}
          cta={audience.primaryCta}
        />
        <section className={styles.content}>
          <div className="container">
            <div className={styles.grid}>
              <article className={styles.panel}>
                <h2>Research context</h2>
                <ul className={styles.proofList}>
                  {audience.proofPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <ConversionButton cta={audience.primaryCta} />
              </article>
              <article className={styles.linkPanel}>
                <h2>Review next</h2>
                <div className={styles.linkGrid}>
                  <TrackedLink to="/market-analysis" eventName="route_audience_segment" eventProps={{segment: 'analysts', destination: 'market-research'}}>Market Research reports</TrackedLink>
                  <TrackedLink to="/industries" eventName="route_audience_segment" eventProps={{segment: 'analysts', destination: 'industries'}}>Industry map</TrackedLink>
                  <TrackedLink to="/products/randao" eventName="route_audience_segment" eventProps={{segment: 'analysts', destination: 'randao'}}>RANDAO thesis</TrackedLink>
                  <TrackedLink to="/media-kit" eventName="route_audience_segment" eventProps={{segment: 'analysts', destination: 'media-kit'}}>Media kit</TrackedLink>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
