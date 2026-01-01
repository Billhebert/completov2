import React, { useMemo, useState } from 'react';
import { Tabs } from '../components/Tabs';
import { OverviewPage } from './OverviewPage';
import { ReportsPage } from './ReportsPage';
import { FunnelsPage } from './FunnelsPage';
import { CohortsPage } from './CohortsPage';
import { ChurnPage } from './ChurnPage';
import { CLVPage } from './CLVPage';

export default function AnalyticsListPage() {
  const tabs = useMemo(
    () => [
      { key: 'overview', label: 'Overview' },
      { key: 'reports', label: 'Reports' },
      { key: 'funnels', label: 'Funnels' },
      { key: 'cohorts', label: 'Cohorts' },
      { key: 'churn', label: 'Churn' },
      { key: 'clv', label: 'CLV' },
    ],
    []
  );

  const [active, setActive] = useState('overview');

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Analytics</h1>
      </div>

      <Tabs tabs={tabs} activeKey={active} onChange={setActive} />

      {active === 'overview' ? <OverviewPage /> : null}
      {active === 'reports' ? <ReportsPage /> : null}
      {active === 'funnels' ? <FunnelsPage /> : null}
      {active === 'cohorts' ? <CohortsPage /> : null}
      {active === 'churn' ? <ChurnPage /> : null}
      {active === 'clv' ? <CLVPage /> : null}
    </div>
  );
}
