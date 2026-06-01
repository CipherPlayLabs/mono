import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {serviceOfferings} from '@site/src/data/site';
import styles from './products/products.module.css';

const consultingFit = [
  'Blockchain | AI | Spatial Computing',
  'IT | Web | E-commerce',
  'Market Validation',
];

const consultingEngagements = [
  {
    eyebrow: 'Emerging technology',
    title: 'Blockchain, AI, and Spatial Computing strategy and execution',
    summary:
      'Shape technical architecture, prototype new workflows, and integrate emerging technology into products or operational systems.',
    capabilities: [
      'Blockchain infrastructure',
      'AI systems and workflows',
      'Spatial Computing software and interfaces',
    ],
  },
  {
    eyebrow: 'Digital operations',
    title: 'IT, web, and e-commerce systems that support the business',
    summary:
      'Improve the digital surface area customers and teams rely on, from web properties and commerce flows to internal systems.',
    capabilities: [
      'IT systems and workflows',
      'Web and e-commerce implementation',
      'Technical architecture, prototypes, and integrations',
    ],
  },
  {
    eyebrow: 'Market Validation',
    title: 'Validate the opportunity before overcommitting build budget',
    summary:
      'Use focused research, product framing, and lightweight experiments to decide what is worth building, buying, or shelving.',
    capabilities: [
      'Opportunity and audience framing',
      'Product thesis and offer validation',
      'Research-backed execution roadmap',
    ],
  },
];

export default function Consulting(): ReactNode {
  const consulting = serviceOfferings[0];

  return (
    <Layout
      title="Consulting"
      description="Emerging Digital Technology & IT Consulting Services for blockchain, AI, Spatial Computing, IT, web, e-commerce, and market validation.">
      <main>
        <CipherHero
          eyebrow="Consulting services"
          title="Emerging Digital Technology & IT Consulting Services"
          summary="For teams that need to validate an opportunity, modernize digital systems, launch web or e-commerce work, or move emerging technology from idea to practical execution."
          cta={consulting.cta}
          ctaEventProps={{page: 'consulting', placement: 'hero'}}
          proofLabel="Consulting fit"
          proofItems={consultingFit}
        />

        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>What we help with</p>
              <h2>Consulting for teams deciding what to build, improve, or validate next.</h2>
            </div>
            <div className={styles.serviceGrid}>
              {consultingEngagements.map((engagement) => (
                <article className={styles.serviceCard} key={engagement.title}>
                  <span>{engagement.eyebrow}</span>
                  <h3>{engagement.title}</h3>
                  <p>{engagement.summary}</p>
                  <ul>
                    {engagement.capabilities.map((capability) => (
                      <li key={capability}>{capability}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.band}>
          <div className="container">
            <div className={styles.consultingPanel}>
              <div>
                <p className={styles.eyebrow}>Consulting discovery</p>
                <h2>For teams that need practical advice before the next technical commitment.</h2>
                <p>
                  Business teams, founders, operators, and technical leaders can use discovery to
                  clarify the problem, map the options, and decide where CipherPlay can help.
                </p>
              </div>
              <ConversionButton
                cta={consulting.cta}
                eventProps={{page: 'consulting', placement: 'discovery-panel', service: consulting.slug}}
              />
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
