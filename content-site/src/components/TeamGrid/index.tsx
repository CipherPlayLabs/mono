import React from 'react';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import {LinkedInMark} from '@site/src/components/LinkedInMark';
import {WebsiteMark} from '@site/src/components/WebsiteMark';
import {teamMembers} from '@site/src/data/site';
import styles from './styles.module.css';

export function TeamGrid(): React.JSX.Element {
  const {withBaseUrl} = useBaseUrlUtils();

  return (
    <div className={styles.grid}>
      {teamMembers.map((member) => (
        <article className={styles.member} key={member.name}>
          <img src={withBaseUrl(member.imageSrc)} alt="" />
          <div>
            <p>{member.role}</p>
            <h3>{member.name}</h3>
            <strong>{member.credential}</strong>
            <span>{member.summary}</span>
            {(member.websiteHref || member.profileHref) && (
              <div className={styles.profileLinks}>
                {member.websiteHref && (
                  <a
                    aria-label={`${member.name} website`}
                    className={styles.profileLink}
                    href={member.websiteHref}
                    target="_blank"
                    rel="noreferrer">
                    <WebsiteMark />
                  </a>
                )}
                {member.profileHref && (
                  <a
                    aria-label={`${member.name} on LinkedIn`}
                    className={styles.profileLink}
                    href={member.profileHref}
                    target="_blank"
                    rel="noreferrer">
                    <LinkedInMark />
                  </a>
                )}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
