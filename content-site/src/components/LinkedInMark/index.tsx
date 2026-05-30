import React from 'react';
import clsx from 'clsx';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faLinkedinIn} from '@fortawesome/free-brands-svg-icons';
import styles from './styles.module.css';

interface LinkedInMarkProps {
  className?: string;
}

export function LinkedInMark({className}: LinkedInMarkProps): React.JSX.Element {
  return (
    <span className={clsx(styles.mark, className)} aria-hidden="true">
      <FontAwesomeIcon icon={faLinkedinIn} />
    </span>
  );
}
