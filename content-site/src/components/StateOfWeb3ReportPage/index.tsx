import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {
  getAdjacentStateOfWeb3Reports,
  stateOfWeb3FullReportCta,
  type StateOfWeb3Report,
} from '@site/src/data/stateOfWeb3';
import styles from './styles.module.css';

function LockedPanel({
  className,
  eyebrow,
  title,
  teaser,
  report,
  children,
}: {
  className: string;
  eyebrow: string;
  title: string;
  teaser: string;
  report: StateOfWeb3Report;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className={className}>
      <div className={styles.lockedPreview} aria-hidden="true">
        {children}
      </div>
      <div className={styles.lockOverlay}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
        <p>{teaser}</p>
        <p className={styles.lockNote}>
          When the public signal matches your decision, get the complete report for the chart
          evidence and research roadmap behind it.
        </p>
        <ConversionButton
          cta={stateOfWeb3FullReportCta}
          eventProps={{report: report.slug, placement: eyebrow.toLowerCase().replaceAll(' ', '-')}}
        />
      </div>
    </section>
  );
}

export function StateOfWeb3ReportPage({
  report,
}: {
  report: StateOfWeb3Report;
}): React.JSX.Element {
  const adjacent = getAdjacentStateOfWeb3Reports(report);

  return (
    <Layout
      title={`${report.title} | State Of Web3`}
      description={report.headline}>
      <main>
        <div className={styles.parentNav}>
          <div className="container">
            <Link to="/market-analysis/state-of-web3">Back to State Of Web3</Link>
          </div>
        </div>
        <CipherHero
          eyebrow={`State Of Web3 | Report ${report.reportNumber} of 8 | ${report.side}`}
          title={report.title}
          summary={report.headline}
          cta={stateOfWeb3FullReportCta}
          ctaEventProps={{report: report.slug, placement: 'report-hero'}}
          proofLabel="People-Class Report"
          proofItems={[
            {label: 'Back to State Of Web3', href: '/market-analysis/state-of-web3'},
            report.peopleClass,
            report.codedEvidence,
          ]}
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.layout}>
              <article className={styles.article}>
                <section>
                  <p className={styles.eyebrow}>Methods</p>
                  <h2>How this People-Class Report was formed.</h2>
                  <p>{report.methods}</p>
                  <p className={styles.evidence}>{report.codedEvidence}</p>
                </section>

                <section>
                  <p className={styles.eyebrow}>People Class And Work</p>
                  <h2>The work this group is trying to complete.</h2>
                  <p>{report.work}</p>
                </section>

                <section>
                  <p className={styles.eyebrow}>Who Their Work Serves</p>
                  <h2>The stakeholders behind the job.</h2>
                  <div className={styles.cardGrid}>
                    {report.serves.map((item) => (
                      <article className={styles.infoCard} key={item.audience}>
                        <h3>{item.audience}</h3>
                        <p>{item.outcome}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <LockedPanel
                  className={styles.lockedGraph}
                  eyebrow="Locked graph"
                  title={report.lockedGraph.title}
                  teaser={report.lockedGraph.teaser}
                  report={report}>
                  <div className={styles.chartShell}>
                    <div className={styles.axisLabel}>Coded criteria evidence</div>
                    {report.lockedGraph.previewBars.map((bar, index) => (
                      <div className={styles.previewBarRow} key={bar}>
                        <span>{bar}</span>
                        <div>
                          <i style={{width: `${88 - index * 14}%`}} />
                        </div>
                      </div>
                    ))}
                    <div className={styles.signalTable}>
                      <span>Coded signals</span>
                      <span>Interviews</span>
                      <span>Representative signal</span>
                    </div>
                  </div>
                </LockedPanel>

                <section>
                  <p className={styles.eyebrow}>Related Solution Providers Or Support Classes</p>
                  <h2>Support classes connected to this need.</h2>
                  <div className={styles.cardGrid}>
                    {report.relatedSupport.map((item) => (
                      <article className={styles.infoCard} key={item.label}>
                        <h3>{item.label}</h3>
                        <p>{item.support}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.summaryPanel}>
                  <p className={styles.eyebrow}>Overall Summary</p>
                  <h2>The public market signal.</h2>
                  <p>{report.overallSummary}</p>
                </section>

                <LockedPanel
                  className={styles.lockedFurtherResearch}
                  eyebrow="Locked further research"
                  title={report.lockedFurtherResearch.title}
                  teaser={report.lockedFurtherResearch.teaser}
                  report={report}>
                  <div className={styles.researchPreview}>
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </LockedPanel>
              </article>

              <aside className={styles.sidebar}>
                <div className={styles.sidebarPanel}>
                  <p className={styles.eyebrow}>Report details</p>
                  <h2>Report {report.reportNumber} of 8</h2>
                  <p>{report.side}</p>
                  <p>{report.peopleClass}</p>
                  <ConversionButton
                    cta={stateOfWeb3FullReportCta}
                    eventProps={{report: report.slug, placement: 'report-sidebar'}}
                  />
                </div>

                <div className={styles.sidebarPanel}>
                  <p className={styles.eyebrow}>Report sequence</p>
                  <Link to="/market-analysis/state-of-web3">Back to State Of Web3</Link>
                  {adjacent.previous && (
                    <Link to={`/market-analysis/state-of-web3/${adjacent.previous.slug}`}>
                      Previous: {adjacent.previous.title}
                    </Link>
                  )}
                  {adjacent.next && (
                    <Link to={`/market-analysis/state-of-web3/${adjacent.next.slug}`}>
                      Next: {adjacent.next.title}
                    </Link>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
