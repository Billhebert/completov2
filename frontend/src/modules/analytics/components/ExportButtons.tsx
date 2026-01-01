import React from 'react';
import { exportCsvUrl } from '../services/analytics.service';

export function ExportButtons() {
  const download = (type: 'contacts' | 'deals') => {
    window.open(exportCsvUrl(type), '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button onClick={() => download('contacts')}>Export Contacts (CSV)</button>
      <button onClick={() => download('deals')}>Export Deals (CSV)</button>
    </div>
  );
}
