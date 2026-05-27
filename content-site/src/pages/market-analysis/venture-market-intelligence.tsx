import type {ReactNode} from 'react';
import {MarketResearchReportPage} from '@site/src/components/MarketResearchReportPage';
import {marketResearchReports} from '@site/src/data/site';

const report = marketResearchReports.find(
  (item) => item.slug === 'venture-market-intelligence',
)!;

export default function VentureMarketIntelligenceReport(): ReactNode {
  return <MarketResearchReportPage report={report} />;
}
