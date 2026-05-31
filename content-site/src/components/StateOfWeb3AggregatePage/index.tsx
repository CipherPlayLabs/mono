import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {
  stateOfWeb3,
  stateOfWeb3FullReportCta,
  stateOfWeb3Reports,
} from '@site/src/data/stateOfWeb3';
import styles from './styles.module.css';

const buidlerReports = stateOfWeb3Reports.filter((report) => report.side === 'Buidler report');
const providerReports = stateOfWeb3Reports.filter((report) => report.side === 'Provider report');

function ReportCard({report}: {report: (typeof stateOfWeb3Reports)[number]}): React.JSX.Element {
  const reportActionLabel = report.side === 'Buidler report' ? 'Read Buidl report' : 'Read Provider report';

  return (
    <Link className={styles.reportCard} to={`/market-analysis/state-of-web3/${report.slug}`}>
      <span>Report {report.reportNumber} / {report.side}</span>
      <h3>{report.title}</h3>
      <p>{report.headline}</p>
      <strong>{reportActionLabel}</strong>
    </Link>
  );
}

export function StateOfWeb3AggregatePage(): React.JSX.Element {
  return (
    <Layout
      title={stateOfWeb3.title}
      description="CipherPlay State Of Web3 Market Research aggregate report.">
      <main>
        <CipherHero
          eyebrow={stateOfWeb3.eyebrow}
          title="State Of Web3"
          summary={`${stateOfWeb3.summary} ${stateOfWeb3.framing}`}
          cta={stateOfWeb3FullReportCta}
          ctaEventProps={{report: 'state-of-web3', placement: 'aggregate-hero'}}
          proofLabel="Report structure"
          proofItems={[
            '8 People-Class Reports',
            'Buidler and provider-side views',
            'Full report available by request',
          ]}
        />

        <section className={`${styles.section} ${styles.overviewSection}`}>
          <div className="container">
            <div className={styles.header}>
              <p>Aggregate view</p>
              <h2>Read the public summary, then go deeper where the signal matters.</h2>
              <p>
                The public page shows market framing, audience work, served stakeholders, support
                classes, and summary signals. High-value charts and further-research roadmaps stay
                gated behind the full report request path.
              </p>
            </div>

            <div className={styles.summaryGrid}>
              <article>
                <span>Buidler side</span>
                <h3>{buidlerReports.length} reports</h3>
                <p>
                  Developers, founders, wallet teams, agent builders, and asset operators show where
                  Web3 products must become usable, trusted, and commercially durable.
                </p>
              </article>
              <article>
                <span>Provider side</span>
                <h3>{providerReports.length} reports</h3>
                <p>
                  Ecosystem, GTM, and audit providers show the support classes behind adoption,
                  credibility, and launch readiness.
                </p>
              </article>
              <article>
                <span>Full Report</span>
                <h3>Charts and research roadmap</h3>
                <p>
                  Locked previews point to the deeper chart evidence and further-research prompts
                  behind the complete evidence pack.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.band}>
          <div className="container">
            <div className={styles.header}>
              <p>Buidler reports</p>
              <h2>Five views into builder-side progress.</h2>
            </div>
            <div className={styles.reportGrid}>
              {buidlerReports.map((report) => (
                <ReportCard key={report.slug} report={report} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Provider reports</p>
              <h2>Three views into ecosystem support, GTM, and launch trust.</h2>
            </div>
            <div className={styles.reportGrid}>
              {providerReports.map((report) => (
                <ReportCard key={report.slug} report={report} />
              ))}
            </div>

            <div className={styles.requestPanel}>
              <div>
                <p className={styles.eyebrow}>Full Report</p>
                <h2>Want the chart evidence and further-research prompts?</h2>
                <p>
                  Get the complete State Of Web3 report when the public pages are relevant to an
                  investment, partnership, product, or customer decision that needs more certainty.
                </p>
              </div>
              <ConversionButton
                cta={stateOfWeb3FullReportCta}
                eventProps={{report: 'state-of-web3', placement: 'aggregate-bottom'}}
              />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
