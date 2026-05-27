import React from 'react';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import {backers, strategicConnections} from '@site/src/data/site';
import styles from './styles.module.css';

function OrganizationGroup({
  title,
  organizations,
}: {
  title: string;
  organizations: typeof backers;
}): React.JSX.Element {
  const {withBaseUrl} = useBaseUrlUtils();

  return (
    <div className={styles.group}>
      <h3>{title}</h3>
      <div className={styles.orgGrid}>
        {organizations.map((organization) => (
          <a
            key={organization.name}
            className={styles.org}
            href={organization.href}
            target="_blank"
            rel="noreferrer">
            <img src={withBaseUrl(organization.logoSrc)} alt="" />
            <span>{organization.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function CredibilityStrip(): React.JSX.Element {
  return (
    <section className={styles.strip}>
      <div className="container">
        <div className={styles.heading}>
          <p>Public proof</p>
          <h2>Backers and strategic connections</h2>
        </div>
        <OrganizationGroup title="Backers" organizations={backers} />
        <OrganizationGroup title="Strategic Connections" organizations={strategicConnections} />
      </div>
    </section>
  );
}
