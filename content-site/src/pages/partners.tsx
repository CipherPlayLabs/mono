import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {partnerPage} from '@site/src/data/site';
import {links} from '../../links';
import styles from './partners.module.css';

const partner = partnerPage;

export default function Partners(): ReactNode {
  return (
    <Layout title="Partners" description={partner.summary}>
      <main className={styles.page}>
        <CipherHero
          eyebrow={partner.eyebrow}
          title={partner.title}
          summary={partner.summary}
          cta={partner.primaryCta}
        />
        <section className={styles.content}>
          <div className="container">
            <div className={styles.grid}>
              <article className={styles.panel}>
                <h2>Collaboration signals</h2>
                <ul className={styles.signalList}>
                  {partner.signals.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <ConversionButton cta={partner.primaryCta} />
              </article>
              <article className={styles.linkPanel}>
                <h2>Review next</h2>
                <div className={styles.linkGrid}>
                  <TrackedLink to="/team" eventName="route_partner_review" eventProps={{destination: 'team'}}>Leadership team</TrackedLink>
                  <TrackedLink to="/products" eventName="route_partner_review" eventProps={{destination: 'products'}}>Products & Services</TrackedLink>
                  <TrackedLink to="/media-kit" eventName="route_partner_review" eventProps={{destination: 'media-kit'}}>Media kit</TrackedLink>
                  <TrackedLink to={links.cipherplayLinkedIn} eventName="route_partner_review" eventProps={{destination: 'linkedin'}}>LinkedIn</TrackedLink>
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
