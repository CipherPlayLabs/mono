import type {ReactNode} from 'react';
import {FormStubPage} from '@site/src/components/FormStubPage';
import {links} from '../../../links';

export default function PartnershipForm(): ReactNode {
  return (
    <FormStubPage
      title="Propose a partnership"
      summary="Hosted request route for partner ecosystem and collaboration inquiries."
      formHref={links.partnerForm}
    />
  );
}
