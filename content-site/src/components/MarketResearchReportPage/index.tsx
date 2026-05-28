import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import type {MarketResearchReport} from '@site/src/data/site';
import styles from './styles.module.css';

export function MarketResearchReportPage({
  report,
}: {
  report: MarketResearchReport;
}): ReactNode {
  return (
    <Layout title={report.title} description={report.executiveSummary}>
      <main>
        <CipherHero
          eyebrow={`${report.eyebrow} | ${report.reportCode}`}
          title={report.title}
          summary={report.executiveSummary}
          cta={report.cta}
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.layout}>
              <article className={styles.article}>
                <section>
                  <p className={styles.eyebrow}>Key findings</p>
                  <h2>What this report covers</h2>
                  <ul className={styles.findings}>
                    {report.keyFindings.map((finding) => (
                      <li key={finding}>{finding}</li>
                    ))}
                  </ul>
                </section>

                <section>
                  <p className={styles.eyebrow}>Market dynamics</p>
                  <h2>Forces shaping the market</h2>
                  <div className={styles.sectionGrid}>
                    {report.marketDynamics.map((dynamic) => (
                      <article className={styles.infoBlock} key={dynamic.title}>
                        <h3>{dynamic.title}</h3>
                        <p>{dynamic.body}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section>
                  <p className={styles.eyebrow}>Segmentation</p>
                  <h2>Market segments tracked by CipherPlay</h2>
                  <div className={styles.sectionGrid}>
                    {report.segments.map((segment) => (
                      <article className={styles.infoBlock} key={segment.title}>
                        <h3>{segment.title}</h3>
                        <p>{segment.body}</p>
                      </article>
                    ))}
                  </div>
                </section>

                <section>
                  <p className={styles.eyebrow}>Questions</p>
                  <h2>Report FAQ</h2>
                  <div className={styles.faqList}>
                    {report.faqs.map((faq) => (
                      <article className={styles.faq} key={faq.question}>
                        <h3>{faq.question}</h3>
                        <p>{faq.answer}</p>
                      </article>
                    ))}
                  </div>
                </section>
              </article>

              <aside className={styles.sidebar}>
                <div className={styles.sidebarPanel}>
                  <p className={styles.eyebrow}>Report details</p>
                  <h2>{report.reportCode}</h2>
                  <div className={styles.tags}>
                    {report.industries.map((industry) => (
                      <span key={industry}>{industry}</span>
                    ))}
                  </div>
                  <ConversionButton cta={report.cta} />
                  <p className={styles.requestNote}>
                    Complete report access is available by request.
                  </p>
                </div>

                <div className={styles.sidebarPanel}>
                  <p className={styles.eyebrow}>Table of contents</p>
                  <ol className={styles.toc}>
                    {report.tableOfContents.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>

                <Link className={styles.backLink} to="/market-analysis">
                  Back to Market Research reports
                </Link>
              </aside>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
