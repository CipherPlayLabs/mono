import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import type {SiteCta} from '@site/src/data/site';

export function ConversionButton({cta}: {cta: SiteCta}): React.JSX.Element {
  if (cta.disabled || !cta.href) {
    return (
      <button className={styles.button} type="button" disabled data-event-name={cta.eventName}>
        {cta.label}
      </button>
    );
  }

  return (
    <Link
      className={styles.button}
      to={cta.href}
      data-event-name={cta.eventName}
      onClick={() => window.plausible?.(cta.eventName)}>
      {cta.label}
    </Link>
  );
}
