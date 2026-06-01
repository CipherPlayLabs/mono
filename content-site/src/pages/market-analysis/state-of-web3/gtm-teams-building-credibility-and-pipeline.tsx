import type {ReactNode} from 'react';
import {StateOfWeb3ReportPage} from '@site/src/components/StateOfWeb3ReportPage';
import {getStateOfWeb3Report} from '@site/src/data/stateOfWeb3';

const report = getStateOfWeb3Report('gtm-teams-building-credibility-and-pipeline')!;

export default function GtmTeamsBuildingCredibilityAndPipelinePage(): ReactNode {
  return <StateOfWeb3ReportPage report={report} />;
}
