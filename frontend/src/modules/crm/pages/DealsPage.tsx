/**
 * Deals Page
 * Página de gestão de negociações com Kanban board
 */

import { useState, useEffect } from 'react';
import { AppLayout, Card, Button, Breadcrumbs } from '../../shared';
import { Deal, DealStage } from '../types';
import * as dealService from '../services/deal.service';
import { DealModal } from '../components';
import { handleApiError } from '../../../core/utils/api';

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-100 border-gray-300' },
  { key: 'qualified', label: 'Qualificado', color: 'bg-blue-100 border-blue-300' },
  { key: 'proposal', label: 'Proposta', color: 'bg-yellow-100 border-yellow-300' },
  { key: 'negotiation', label: 'Negociação', color: 'bg-orange-100 border-orange-300' },
  { key: 'won', label: 'Ganho', color: 'bg-green-100 border-green-300' },
  { key: 'lost', label: 'Perdido', color: 'bg-red-100 border-red-300' },
];

export const DealsPage = () => {
  const [dealsByStage, setDealsByStage] = useState<Record<DealStage, Deal[]>>({
    lead: [],
    qualified: [],
    proposal: [],
    negotiation: [],
    won: [],
    lost: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalValue, setTotalValue] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [defaultStage, setDefaultStage] = useState<DealStage | undefined>(undefined);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await dealService.getDeals({ page: 1, limit: 100 });

      // Organizar deals por estágio
      const organized = STAGES.reduce((acc, stage) => {
        acc[stage.key] = result.data.filter(d => d.stage === stage.key);
        return acc;
      }, {} as Record<DealStage, Deal[]>);

      setDealsByStage(organized);

      // Calcular valor total de deals ativos (não won/lost)
      const activeDeals = result.data.filter(d => !['won', 'lost'].includes(d.stage));
      const total = activeDeals.reduce((sum, deal) => sum + deal.value, 0);
      setTotalValue(total);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    const labels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badges[priority as keyof typeof badges]}`}>
        {labels[priority as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCreateDeal = (stage?: DealStage) => {
    setEditingDeal(null);
    setDefaultStage(stage);
    setIsModalOpen(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setDefaultStage(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
    setDefaultStage(undefined);
  };

  const handleSaveDeal = async (data: any) => {
    try {
      if (editingDeal) {
        await dealService.updateDeal(editingDeal.id, data);
      } else {
        await dealService.createDeal(data);
      }
      await loadDeals();
    } catch (err) {
      throw new Error(handleApiError(err));
    }
  };

  const handleDeleteDeal = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta negociação?')) {
      return;
    }

    try {
      await dealService.deleteDeal(id);
      await loadDeals();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'CRM', path: '/crm' },
            { label: 'Negociações' }
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline de Vendas</h1>
            <p className="text-gray-600 mt-1">
              Gerencie suas oportunidades e negociações
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={() => handleCreateDeal()}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Oportunidade
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Object.values(dealsByStage).flat().length}
              </div>
              <div className="text-sm text-gray-600">Total de Deals</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalValue)}
              </div>
              <div className="text-sm text-gray-600">Valor em Pipeline</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {dealsByStage.won.length}
              </div>
              <div className="text-sm text-gray-600">Ganhos</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dealsByStage.negotiation.length}
              </div>
              <div className="text-sm text-gray-600">Em Negociação</div>
            </div>
          </Card>
        </div>

        {/* Kanban Board */}
        {isLoading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {STAGES.map((stage) => (
                <div key={stage.key} className="flex-shrink-0 w-80">
                  <div className={`rounded-lg border-2 ${stage.color} p-4`}>
                    {/* Stage Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {stage.label}
                        </h3>
                        <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                          {dealsByStage[stage.key].length}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCreateDeal(stage.key)}
                        className="text-gray-600 hover:text-blue-600 transition"
                        title="Adicionar deal"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Deals Cards */}
                    <div className="space-y-3">
                      {dealsByStage[stage.key].length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          Nenhuma oportunidade
                        </div>
                      ) : (
                        dealsByStage[stage.key].map((deal) => (
                          <Card key={deal.id} className="bg-white hover:shadow-md transition group relative">
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditDeal(deal);
                                }}
                                className="p-1 bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 transition"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDeal(deal.id);
                                }}
                                className="p-1 bg-white rounded shadow-sm text-gray-600 hover:text-red-600 transition"
                                title="Excluir"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            <div className="space-y-2">
                              {/* Title */}
                              <h4 className="font-medium text-gray-900 line-clamp-2 pr-16">
                                {deal.title}
                              </h4>

                              {/* Value */}
                              <div className="text-lg font-bold text-blue-600">
                                {formatCurrency(deal.value)}
                              </div>

                              {/* Contact/Company */}
                              {(deal.contactName || deal.companyName) && (
                                <div className="text-sm text-gray-600">
                                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  {deal.companyName || deal.contactName}
                                </div>
                              )}

                              {/* Priority & Probability */}
                              <div className="flex items-center justify-between">
                                {getPriorityBadge(deal.priority)}
                                <span className="text-xs text-gray-500">
                                  {deal.probability}% chance
                                </span>
                              </div>

                              {/* Assigned To */}
                              {deal.assignedToName && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {deal.assignedToName}
                                </div>
                              )}
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deal Modal */}
        <DealModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveDeal}
          deal={editingDeal}
          defaultStage={defaultStage}
        />
      </div>
    </AppLayout>
  );
};

export default DealsPage;
