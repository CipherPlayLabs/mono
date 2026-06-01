import type {ReactNode} from 'react';
import {StateOfWeb3ReportPage} from '@site/src/components/StateOfWeb3ReportPage';
import {getStateOfWeb3Report} from '@site/src/data/stateOfWeb3';

const report = getStateOfWeb3Report('developers-building-on-new-chains')!;

export default function DevelopersBuildingOnNewChainsPage(): ReactNode {
  return <StateOfWeb3ReportPage report={report} />;
}
