/**
 * Base de Conhecimento List Page
 */

import React, { useState, useEffect } from 'react';
import { AppLayout, Card, Button, DataTable } from '../../shared';
import * as knowledgeService from '../services/knowledge.service';
import { Knowledge } from '../types';
import { handleApiError } from '../../../core/utils/api';

export const KnowledgeListPage: React.FC = () => {
  const [data, setData] = useState<Knowledge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await knowledgeService.getAll();
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
          <h1 className="text-3xl font-bold text-gray-900">Base de Conhecimento</h1>
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

export default KnowledgeListPage;
