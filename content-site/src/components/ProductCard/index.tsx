import React from 'react';
import Link from '@docusaurus/Link';
import type {Product} from '@site/src/data/site';
import {ConversionButton} from '@site/src/components/ConversionButton';
import styles from './styles.module.css';

export function ProductCard({product}: {product: Product}): React.JSX.Element {
  return (
    <article className={styles.card}>
      <div>
        <span>{product.status}</span>
        <h3>{product.name}</h3>
        <p>{product.summary}</p>
      </div>
      <div className={styles.actions}>
        <Link to={product.href}>View product</Link>
        <ConversionButton cta={product.cta} />
      </div>
    </article>
  );
}
