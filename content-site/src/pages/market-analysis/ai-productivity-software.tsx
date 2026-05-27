import type {ReactNode} from 'react';
import {MarketResearchReportPage} from '@site/src/components/MarketResearchReportPage';
import {marketResearchReports} from '@site/src/data/site';

const report = marketResearchReports.find(
  (item) => item.slug === 'ai-productivity-software',
)!;

export default function AiProductivitySoftwareReport(): ReactNode {
  return <MarketResearchReportPage report={report} />;
}
