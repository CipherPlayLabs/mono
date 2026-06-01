import type {ReactNode} from 'react';
import {FormStubPage} from '@site/src/components/FormStubPage';
import {links} from '../../../links';

export default function ConsultingDiscoveryForm(): ReactNode {
  return (
    <FormStubPage
      title="Start consulting discovery"
      summary="Hosted request route for blockchain, AI, and Spatial Computing infrastructure/software consulting inquiries."
      formHref={links.customerForm}
    />
  );
}
