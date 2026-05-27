import type {ReactNode} from 'react';
import {MarketResearchReportPage} from '@site/src/components/MarketResearchReportPage';
import {marketResearchReports} from '@site/src/data/site';

const report = marketResearchReports.find(
  (item) => item.slug === 'cryptographic-infrastructure',
)!;

export default function CryptographicInfrastructureReport(): ReactNode {
  return <MarketResearchReportPage report={report} />;
}
