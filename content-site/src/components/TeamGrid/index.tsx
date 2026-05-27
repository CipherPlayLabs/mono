import React from 'react';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
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
            {member.profileHref && (
              <a href={member.profileHref} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
