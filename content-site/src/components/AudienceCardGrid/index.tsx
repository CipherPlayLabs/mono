import React from 'react';
import {audiencePages} from '@site/src/data/site';
import {TrackedLink} from '@site/src/components/TrackedLink';
import styles from './styles.module.css';

export function AudienceCardGrid(): React.JSX.Element {
  return (
    <div className={styles.grid}>
      {audiencePages.map((audience) => (
        <TrackedLink
          key={audience.slug}
          to={`/${audience.slug}`}
          eventName="route_audience_segment"
          eventProps={{segment: audience.slug}}
          className={styles.card}>
          <span>{audience.eyebrow}</span>
          <h3>{audience.navLabel}</h3>
          <p>{audience.summary}</p>
        </TrackedLink>
      ))}
    </div>
  );
}
