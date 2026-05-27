import React from 'react';
import Link from '@docusaurus/Link';

declare global {
  interface Window {
    plausible?: (eventName: string, options?: {props?: Record<string, string>}) => void;
  }
}

interface TrackedLinkProps {
  to: string;
  eventName: string;
  eventProps?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
}

export function TrackedLink({
  to,
  eventName,
  eventProps,
  className,
  children,
}: TrackedLinkProps): React.JSX.Element {
  return (
    <Link
      to={to}
      className={className}
      onClick={() => window.plausible?.(eventName, {props: eventProps})}>
      {children}
    </Link>
  );
}
