import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';
import type {SiteCta} from '@site/src/data/site';

interface ConversionButtonProps {
  cta: SiteCta;
  eventProps?: Record<string, string>;
  proof?: string;
}

export function ConversionButton({
  cta,
  eventProps,
  proof,
}: ConversionButtonProps): React.JSX.Element {
  const proofText = proof ?? cta.proof;
  const analyticsProps = {
    label: cta.label,
    destination: cta.href,
    ...eventProps,
  };
  const eventOptions = {props: analyticsProps};

  if (cta.disabled || !cta.href) {
    return (
      <span className={styles.ctaWrap}>
        <button className={styles.button} type="button" disabled data-event-name={cta.eventName}>
          {cta.label}
        </button>
        {proofText && <span className={styles.proof}>{proofText}</span>}
      </span>
    );
  }

  return (
    <span className={styles.ctaWrap}>
      <Link
        className={styles.button}
        to={cta.href}
        data-event-name={cta.eventName}
        onClick={() => window.plausible?.(cta.eventName, eventOptions)}>
        {cta.label}
      </Link>
      {proofText && <span className={styles.proof}>{proofText}</span>}
    </span>
  );
}
