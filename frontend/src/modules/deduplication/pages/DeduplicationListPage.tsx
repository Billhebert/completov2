/**
 * Deduplicação IA List Page
 */

import React, { useState, useEffect } from 'react';
import { AppLayout, Card, Button, DataTable } from '../../shared';
import * as deduplicationService from '../services/deduplication.service';
import { Deduplication } from '../types';
import { handleApiError } from '../../../core/utils/api';

export const DeduplicationListPage: React.FC = () => {
  const [data, setData] = useState<Deduplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await deduplicationService.getAll();
      setData(result.data);
    } catch (error) {
      console.error('Error loading data:', handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="text-3xl font-bold text-gray-900">Deduplicação IA</h1>
          <Button variant="primary">Criar Novo</Button>
        </div>

        <Card noPadding>
          <DataTable
            columns={[
              { key: 'name', label: 'Nome', sortable: true },
              { key: 'status', label: 'Status' },
              { key: 'createdAt', label: 'Criado em' },
            ]}
            data={data}
            keyExtractor={(record) => record.id}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </AppLayout>
  );
};

export default DeduplicationListPage;
