import type {ReactNode} from 'react';
import {StateOfWeb3ReportPage} from '@site/src/components/StateOfWeb3ReportPage';
import {getStateOfWeb3Report} from '@site/src/data/stateOfWeb3';

const report = getStateOfWeb3Report(
  'operators-monetizing-assets-under-trust-and-compliance-constraints',
)!;

export default function OperatorsMonetizingAssetsPage(): ReactNode {
  return <StateOfWeb3ReportPage report={report} />;
}
