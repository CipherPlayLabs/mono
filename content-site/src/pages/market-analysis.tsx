import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {TrackedLink} from '@site/src/components/TrackedLink';
import {marketResearchReports} from '@site/src/data/site';
import styles from './market-analysis.module.css';

export default function MarketAnalysis(): ReactNode {
  return (
    <Layout
      title="Market Research Reports"
      description="CipherPlay Market Research reports for emerging technology.">
      <main>
        <CipherHero
          eyebrow="Market Research reports"
          title="Market Research reports for emerging-technology decisions."
          summary="CipherPlay publishes useful public Market Research reports with industry framing, market dynamics, segment maps, and full-report email requests routed through the forms flow."
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Reports</p>
              <h2>Read the public report pages, then request the full report by email.</h2>
            </div>
            <div className={styles.reportGrid}>
              {marketResearchReports.map((report) => (
                <article className={styles.report} key={report.slug}>
                  <div>
                    <div className={styles.tags}>
                      {report.industries.map((industry) => (
                        <span key={industry}>{industry}</span>
                      ))}
                    </div>
                    <p className={styles.reportCode}>{report.reportCode}</p>
                    <h2>{report.title}</h2>
                    <p>{report.executiveSummary}</p>
                  </div>
                  <div className={styles.actions}>
                    <TrackedLink
                      to={report.href}
                      eventName="market_analysis_teaser_click"
                      eventProps={{report: report.slug}}>
                      View report
                    </TrackedLink>
                    <ConversionButton cta={report.cta} />
                  </div>
                </article>
              ))}
            </div>
            <p className={styles.note}>
              Public report pages include substantive market research. Full private report
              files are not committed to the public content site and will be sent through
              the request flow.
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
