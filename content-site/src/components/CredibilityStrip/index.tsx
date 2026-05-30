import React from 'react';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import {backers, partnerEcosystem} from '@site/src/data/site';
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
            {organization.logoSrc ? (
              <img
                className={organization.logoFrame === 'dark' ? styles.logoDark : undefined}
                src={withBaseUrl(organization.logoSrc)}
                alt=""
              />
            ) : (
              <span className={styles.orgMark}>{organization.name.slice(0, 2)}</span>
            )}
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
          <h2>Backers and partner ecosystem relationships</h2>
          <span>
            Relationship labels follow the public company glossary: backers provided financial
            support; partner ecosystem entries indicate broader collaboration context.
          </span>
        </div>
        <OrganizationGroup title="Backers" organizations={backers} />
        <OrganizationGroup title="Partner Ecosystem" organizations={partnerEcosystem} />
      </div>
    </section>
  );
}
