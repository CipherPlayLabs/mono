import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {CredibilityStrip} from '@site/src/components/CredibilityStrip';
import {LinkedInMark} from '@site/src/components/LinkedInMark';
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
          title="Partner with a studio that turns market insight into product opportunities."
          summary="CipherPlay works with accelerators, ecosystems, labs, companies, and technical communities where research, product execution, and market access can create mutual leverage."
          cta={partner.primaryCta}
          ctaEventProps={{page: 'partners', placement: 'hero'}}
          proofLabel="Partner on"
          proofItems={[
            'Product Integration',
            'Distribution',
            'Market Validation',
          ]}
        />
        <section className={styles.content}>
          <div className="container">
            <div className={styles.header}>
              <p className={styles.eyebrow}>How we work with partners</p>
              <h2>Partnerships should create mutual leverage.</h2>
              <p className={styles.lede}>
                Start with the collaboration type that creates a clear win for the partner
                while strengthening CipherPlay research, product, or market access.
              </p>
            </div>
            <div className={styles.grid}>
              <article className={styles.panel}>
                <h2>Ways to collaborate</h2>
                <ul className={styles.signalList}>
                  {partner.signals.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <ConversionButton
                  cta={partner.primaryCta}
                  eventProps={{page: 'partners', placement: 'ways-to-collaborate'}}
                />
              </article>
              <article className={styles.linkPanel}>
                <h2>Review next</h2>
                <div className={styles.linkGrid}>
                  <TrackedLink to="/team" eventName="route_partner_review" eventProps={{destination: 'team'}}>Leadership team</TrackedLink>
                  <TrackedLink to="/products" eventName="route_partner_review" eventProps={{destination: 'products'}}>Products</TrackedLink>
                  <TrackedLink to="/consulting" eventName="route_partner_review" eventProps={{destination: 'consulting'}}>Consulting</TrackedLink>
                  <TrackedLink to="/media-kit" eventName="route_partner_review" eventProps={{destination: 'media-kit'}}>Media kit</TrackedLink>
                  <TrackedLink to={links.cipherplayLinkedIn} eventName="route_partner_review" eventProps={{destination: 'linkedin'}}>
                    <span className={styles.iconLink}>
                      <LinkedInMark />
                      LinkedIn
                    </span>
                  </TrackedLink>
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
