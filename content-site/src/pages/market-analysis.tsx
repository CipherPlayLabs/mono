import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {links} from '../../links';
import styles from './market-analysis.module.css';

const reportRequestCta = {
  label: 'Request full report',
  href: links.reportRequestForm,
  eventName: 'cta_research_access',
  disabled: false,
};

export default function MarketAnalysis(): ReactNode {
  return (
    <Layout
      title="Market Research Reports"
      description="CipherPlay Market Research reports for emerging technology.">
      <main>
        <CipherHero
          eyebrow="Market Research reports"
          title="Market Research reports for emerging-technology decisions."
          summary="CipherPlay conducts and publishes detailed market research reports that de-risk emerging-technology opportunities for investors while helping customers and partners understand market opportunities."
          cta={reportRequestCta}
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Reports</p>
              <h2>No approved public report pages are listed right now.</h2>
            </div>
            <p className={styles.note}>
              Request a Full Report when you need more detailed Market Intelligence from
              CipherPlay.
            </p>
            <ConversionButton cta={reportRequestCta} />
          </div>
        </section>
      </main>
    </Layout>
  );
}
