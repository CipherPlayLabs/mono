import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import isInternalUrl from '@docusaurus/isInternalUrl';
import {LinkedInMark} from '@site/src/components/LinkedInMark';
import IconExternalLink from '@theme/Icon/ExternalLink';
import type {Props} from '@theme/Footer/LinkItem';

export default function FooterLinkItem({item}: Props): ReactNode {
  const {to, href, label, prependBaseUrlToHref, className, ...props} = item;
  const toUrl = useBaseUrl(to);
  const normalizedHref = useBaseUrl(href, {forcePrependBaseUrl: true});
  const isLinkedIn = label === 'LinkedIn' || href?.includes('linkedin.com');

  return (
    <Link
      className={clsx('footer__link-item', className)}
      {...(href
        ? {
            href: prependBaseUrlToHref ? normalizedHref : href,
          }
        : {
            to: toUrl,
      })}
      {...props}>
      {isLinkedIn && (
        <>
          <LinkedInMark />{' '}
        </>
      )}
      {label}
      {href && !isInternalUrl(href) && <IconExternalLink />}
    </Link>
  );
}
