import React from 'react';
import Link from '@docusaurus/Link';
import type {Product} from '@site/src/data/site';
import {ConversionButton} from '@site/src/components/ConversionButton';
import styles from './styles.module.css';

export function ProductCard({product}: {product: Product}): React.JSX.Element {
  return (
    <article className={styles.card}>
      <div>
        <span className={styles.status}>{product.status}</span>
        <h3>{product.name}</h3>
        <p>{product.summary}</p>
      </div>
      {(product.href || product.cta) && (
        <div className={styles.actions}>
          {product.href && (
            <Link className={styles.secondaryAction} to={product.href}>
              {product.linkLabel ?? 'View product'}
            </Link>
          )}
          {product.cta && (
            <div className={styles.primaryAction}>
              <ConversionButton
                cta={product.cta}
                eventProps={{placement: 'product-card', product: product.slug}}
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
}
