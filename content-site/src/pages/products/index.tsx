import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ConversionButton} from '@site/src/components/ConversionButton';
import {ProductCard} from '@site/src/components/ProductCard';
import {productHistory, products, serviceOfferings} from '@site/src/data/site';
import styles from './products.module.css';

export default function Products(): ReactNode {
  return (
    <Layout
      title="Products & Services"
      description="CipherPlay products, current services, and historic product history.">
      <main>
        <CipherHero
          eyebrow="Products & Services"
          title="Current infrastructure products and consulting services."
          summary="CipherPlay builds and supports emerging-technology software across blockchain, AI, and VR. The current page separates active products and services from historic sunset projects."
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Current product</p>
              <h2>RANDAO anchors CipherPlay's blockchain infrastructure work.</h2>
            </div>
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.band}>
          <div className="container">
            <div className={styles.header}>
              <p>Current services</p>
              <h2>Infrastructure and software consulting for blockchain, AI, and VR teams.</h2>
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
              <h2>Historic sunset projects retained as founder and technical history.</h2>
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
