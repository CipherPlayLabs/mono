import React from 'react';
import clsx from 'clsx';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faGlobe} from '@fortawesome/free-solid-svg-icons';
import styles from './styles.module.css';

interface WebsiteMarkProps {
  className?: string;
}

export function WebsiteMark({className}: WebsiteMarkProps): React.JSX.Element {
  return (
    <span className={clsx(styles.mark, className)} aria-hidden="true">
      <FontAwesomeIcon icon={faGlobe} />
    </span>
  );
}
