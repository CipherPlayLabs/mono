import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {stateOfWeb3, stateOfWeb3ReadCta, stateOfWeb3Reports} from '@site/src/data/stateOfWeb3';
import styles from './market-analysis.module.css';

const stateOfWeb3CatalogCta = {
  ...stateOfWeb3ReadCta,
  label: 'Read State of Web3',
  href: '/market-analysis/state-of-web3',
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
  const buidlerCount = stateOfWeb3Reports.filter((report) => report.side === 'Buidler report').length;
  const providerCount = stateOfWeb3Reports.length - buidlerCount;

  return (
    <Layout
      title="Market Research Reports"
      description="CipherPlay Market Research reports for emerging technology.">
      <main>
        <CipherHero
          eyebrow="Market Research reports"
          title="Start with the public research. Go deeper when the signal matters."
          summary="CipherPlay publishes Market Research to turn noisy emerging-digital markets into clearer context for investors, partners, and customers. State Of Web3 is the first public report surface, with deeper Market Intelligence available from inside the report."
          cta={stateOfWeb3CatalogCta}
          ctaEventProps={{report: 'state-of-web3', placement: 'market-analysis-hero'}}
          proofLabel="Market Research"
          proofItems={[
            {label: 'State Of Web3', href: '/market-analysis/state-of-web3'},
            'Identify Market Opportunities',
            'Buyer Decision Making',
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
                <h2>State Of Web3 is available to read.</h2>
                <p className={styles.note}>
                  {stateOfWeb3.summary} The public pages give readers useful context first, then
                  place the highest-value graph evidence and further-research roadmap behind the
                  State of Web3 request path.
                </p>
                <div className={styles.reportMeta}>
                  <span>{stateOfWeb3Reports.length} People-Class Reports</span>
                  <span>{buidlerCount} buidler views</span>
                  <span>{providerCount} provider views</span>
                </div>
              </div>
              <ConversionButton
                cta={stateOfWeb3CatalogCta}
                eventProps={{report: 'state-of-web3', placement: 'catalog-card'}}
              />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
