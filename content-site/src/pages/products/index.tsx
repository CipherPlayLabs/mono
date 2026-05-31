import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ProductCard} from '@site/src/components/ProductCard';
import {productHistory, products} from '@site/src/data/site';
import styles from './products.module.css';

export default function Products(): ReactNode {
  return (
    <Layout
      title="Products"
      description="CipherPlay current products and historic product portfolio.">
      <main>
        <CipherHero
          eyebrow="Products"
          title="Products that turn research theses into shipped infrastructure."
          summary="CipherPlay builds and operates emerging-technology software. RANDAO is the current public product anchor, with earlier product work retained as clearly labeled founder and technical history."
          proofLabel="Product proof"
          proofItems={[
            'RANDAO product ownership',
            'Public whitepaper and live product site',
            'Previous product portfolio',
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

        <section className={styles.band}>
          <div className="container">
            <article className={styles.consultingPanel}>
              <div>
                <p className={styles.eyebrow}>Need execution support?</p>
                <h2>Consulting has its own discovery path.</h2>
                <p>
                  Use the consulting page when your team needs research-backed architecture,
                  prototypes, integrations, or software execution for blockchain, AI, or Spatial
                  Computing work.
                </p>
              </div>
              <Link className={styles.textLink} to="/consulting">
                Review consulting services
              </Link>
            </article>
          </div>
        </section>
      </main>
    </Layout>
  );
}
