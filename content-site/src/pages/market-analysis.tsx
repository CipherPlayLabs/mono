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

const researchRoles = [
  {
    label: 'Market visibility',
    title: 'Published research',
    summary:
      'Public research shows the markets, questions, and technical shifts CipherPlay is tracking.',
  },
  {
    label: 'Risk context',
    title: 'Full Reports',
    summary:
      'Full Reports add deeper market intelligence for investors, partners, and customers making higher-stakes decisions.',
  },
  {
    label: 'Execution path',
    title: 'Product theses',
    summary:
      'Research informs product thesis development, technical execution, and future opportunity formation.',
  },
];

export default function MarketAnalysis(): ReactNode {
  return (
    <Layout
      title="Market Research Reports"
      description="CipherPlay Market Research reports for emerging technology.">
      <main>
        <CipherHero
          eyebrow="Market Research reports"
          title="De-risk emerging digital technology markets."
          summary="CipherPlay publishes Market Research to turn noisy emerging-digital markets into clearer context for investors, partners, and customers. Full Reports remain request-gated for deeper Market Intelligence."
          cta={reportRequestCta}
          proofLabel="Market Research"
          proofItems={[
            'Market visibility',
            'Risk context',
            'Product thesis development',
          ]}
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Research role</p>
              <h2>Market Research turns uncertainty into useful decision context.</h2>
            </div>
            <div className={styles.researchGrid}>
              {researchRoles.map((role) => (
                <article className={styles.researchCard} key={role.title}>
                  <span>{role.label}</span>
                  <h3>{role.title}</h3>
                  <p>{role.summary}</p>
                </article>
              ))}
            </div>
            <div className={styles.requestPanel}>
              <div>
                <p className={styles.eyebrow}>Reports</p>
                <h2>No approved public report pages are listed right now.</h2>
                <p className={styles.note}>
                  Request a Full Report when you need deeper Market Intelligence for an investment,
                  partnership, product, or customer decision.
                </p>
              </div>
              <ConversionButton cta={reportRequestCta} />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
