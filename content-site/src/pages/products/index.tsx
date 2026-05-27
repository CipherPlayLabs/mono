import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import {CipherHero} from '@site/src/components/CipherHero';
import {ProductCard} from '@site/src/components/ProductCard';
import {products} from '@site/src/data/site';
import styles from './products.module.css';

export default function Products(): ReactNode {
  return (
    <Layout title="Products" description="CipherPlay products and product proof.">
      <main>
        <CipherHero
          eyebrow="Products"
          title="Emerging-tech software products with research behind them."
          summary="CipherPlay uses public research, product thesis work, and software execution to move emerging-technology ideas toward usable products, including current and sunset product proof."
        />
        <section className={styles.section}>
          <div className="container">
            <div className={styles.header}>
              <p>Product portfolio</p>
              <h2>Current and sunset products are shown with clear status labels.</h2>
            </div>
            <div className={styles.productGrid}>
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
