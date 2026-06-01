import type {ReactNode} from 'react';
import {StateOfWeb3ReportPage} from '@site/src/components/StateOfWeb3ReportPage';
import {getStateOfWeb3Report} from '@site/src/data/stateOfWeb3';

const report = getStateOfWeb3Report('blockchain-relations-teams-growing-ecosystem-adoption')!;

export default function BlockchainRelationsTeamsPage(): ReactNode {
  return <StateOfWeb3ReportPage report={report} />;
}
