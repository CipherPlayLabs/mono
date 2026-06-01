import type {ReactNode} from 'react';
import {FormStubPage} from '@site/src/components/FormStubPage';
import {links} from '../../../links';

export default function ReportRequestForm(): ReactNode {
  return (
    <FormStubPage
      title="Request full report"
      summary="Hosted request route for Full Report access."
      formHref={links.reportRequestForm}
    />
  );
}
