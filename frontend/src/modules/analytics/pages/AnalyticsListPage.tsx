import React, { useMemo, useState } from 'react';
import { AppLayout } from '../../shared/components/Layout/AppLayout';
import { Breadcrumbs } from '../../shared/components/Navigation/Breadcrumbs';
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
      { key: 'reports', label: 'Relatórios' },
      { key: 'funnels', label: 'Funis' },
      { key: 'cohorts', label: 'Coortes' },
      { key: 'churn', label: 'Churn' },
      { key: 'clv', label: 'CLV' },
    ],
    []
  );

  const [active, setActive] = useState('overview');

  return (
    <AppLayout>
      <div className="page-container">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Analytics', href: '/analytics' },
          ]}
        />

        <div className="page-header">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        </div>

        <div className="space-y-6">
          <Tabs tabs={tabs} activeKey={active} onChange={setActive} />

          {active === 'overview' && <OverviewPage />}
          {active === 'reports' && <ReportsPage />}
          {active === 'funnels' && <FunnelsPage />}
          {active === 'cohorts' && <CohortsPage />}
          {active === 'churn' && <ChurnPage />}
          {active === 'clv' && <CLVPage />}
        </div>
      </div>
    </AppLayout>
  );
}
