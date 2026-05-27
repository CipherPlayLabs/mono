import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {audiencePages} from '@site/src/data/site';
import {links} from '../../links';
import styles from './audiencePage.module.css';

const audience = audiencePages.find((page) => page.slug === 'partners')!;

export default function Partners(): ReactNode {
  return (
    <Layout title="Partners" description={audience.summary}>
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
                <h2>Collaboration signals</h2>
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
                  <TrackedLink to="/team" eventName="route_audience_segment" eventProps={{segment: 'partners', destination: 'team'}}>Leadership team</TrackedLink>
                  <TrackedLink to="/products" eventName="route_audience_segment" eventProps={{segment: 'partners', destination: 'products'}}>Products & Services</TrackedLink>
                  <TrackedLink to="/industries" eventName="route_audience_segment" eventProps={{segment: 'partners', destination: 'industries'}}>Industry pillars</TrackedLink>
                  <TrackedLink to="/media-kit" eventName="route_audience_segment" eventProps={{segment: 'partners', destination: 'media-kit'}}>Media kit</TrackedLink>
                  <TrackedLink to={links.cipherplayLinkedIn} eventName="route_partner_context" eventProps={{destination: 'linkedin'}}>LinkedIn</TrackedLink>
                </div>
              </article>
            </div>
          </div>
        </section>
        <CredibilityStrip />
      </main>
    </Layout>
  );
}
