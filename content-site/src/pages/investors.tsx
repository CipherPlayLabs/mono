import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {audiencePages} from '@site/src/data/site';
import styles from './audiencePage.module.css';

const audience = audiencePages.find((page) => page.slug === 'investors')!;

export default function Investors(): ReactNode {
  return (
    <Layout title="Investors" description={audience.summary}>
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
                <h2>Diligence signals</h2>
                <ul className={styles.signalList}>
                  {audience.signals.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <ConversionButton cta={audience.primaryCta} />
              </article>
              <article className={styles.linkPanel}>
                <h2>Review next</h2>
                <div className={styles.linkGrid}>
                  <TrackedLink to="/products/randao" eventName="route_audience_segment" eventProps={{segment: 'investors', destination: 'randao'}}>RANDAO</TrackedLink>
                  <TrackedLink to="/team" eventName="route_audience_segment" eventProps={{segment: 'investors', destination: 'team'}}>Leadership team</TrackedLink>
                  <TrackedLink to="/industries" eventName="route_audience_segment" eventProps={{segment: 'investors', destination: 'industries'}}>Industry pillars</TrackedLink>
                  <TrackedLink to="/market-analysis" eventName="route_audience_segment" eventProps={{segment: 'investors', destination: 'market-research'}}>Market Research reports</TrackedLink>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
