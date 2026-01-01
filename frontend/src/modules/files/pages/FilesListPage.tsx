/**
 * Arquivos List Page
 */

import React, { useState, useEffect } from 'react';
import { AppLayout, Card, Button, DataTable } from '../../shared';
import * as filesService from '../services/files.service';
import { Files } from '../types';
import { handleApiError } from '../../../core/utils/api';

export const FilesListPage: React.FC = () => {
  const [data, setData] = useState<Files[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await filesService.getAll();
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
          <h1 className="text-3xl font-bold text-gray-900">Arquivos</h1>
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

export default FilesListPage;
