import type {ReactNode} from 'react';
import {StateOfWeb3ReportPage} from '@site/src/components/StateOfWeb3ReportPage';
import {getStateOfWeb3Report} from '@site/src/data/stateOfWeb3';

const report = getStateOfWeb3Report('wallet-teams-simplifying-crypto-payments')!;

export default function WalletTeamsSimplifyingCryptoPaymentsPage(): ReactNode {
  return <StateOfWeb3ReportPage report={report} />;
}
