import type {ReactNode} from 'react';
import {FormStubPage} from '@site/src/components/FormStubPage';
import {links} from '../../../links';

export default function InvestorMaterialsForm(): ReactNode {
  return (
    <FormStubPage
      title="Request investor materials"
      summary="Hosted request route for investors requesting CipherPlay investor materials."
      formHref={links.investorForm}
    />
  );
}
