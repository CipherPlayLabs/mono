import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {ProductCard} from '@site/src/components/ProductCard';
import {productHistory, products, serviceOfferings} from '@site/src/data/site';
import styles from './products.module.css';

export default function Products(): ReactNode {
  useBrokenLinks().collectAnchor('consulting-services');

  return (
    <Layout
      title="Products & Services"
      description="CipherPlay products, current services, and historic product history.">
      <main>
        <CipherHero
          eyebrow="Products & Services"
          title="Software execution that turns research theses into shipped work."
          summary="CipherPlay builds and supports emerging-technology software across blockchain, AI, and Spatial Computing. RANDAO is the current public product anchor; consulting supports research-backed architecture, prototypes, integrations, and execution."
          proofLabel="Products & Services"
          proofItems={[
            'Current Products',
            'Consulting Services',
            'Previous Product Portfolio',
          ]}
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Current products</p>
              <h2>CipherPlay builds owned products for emerging-digital markets.</h2>
            </div>
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.band} id="consulting-services">
          <div className="container">
            <div className={styles.header}>
              <p>Current services</p>
              <h2>Infrastructure and software consulting for teams moving from uncertainty to execution.</h2>
            </div>
            <div className={styles.serviceGrid}>
              {serviceOfferings.map((service) => (
                <article className={styles.serviceCard} key={service.slug}>
                  <span>{service.status}</span>
                  <h3>{service.name}</h3>
                  <p>{service.summary}</p>
                  <ul>
                    {service.capabilities.map((capability) => (
                      <li key={capability}>{capability}</li>
                    ))}
                  </ul>
                  <ConversionButton cta={service.cta} />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Product history</p>
              <h2>Historic sunset projects stay clearly labeled as founder and technical history.</h2>
            </div>
            <div className={styles.productGrid}>
              {productHistory.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
