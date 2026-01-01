/**
 * Deal Modal Component
 * Modal para criar/editar negociações
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Deal, DealStage } from '../types';
import { Button, Input } from '../../shared';

const dealSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  value: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  priority: z.enum(['low', 'medium', 'high']),
  probability: z.number().min(0).max(100),
  contactName: z.string().optional(),
  companyName: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

interface DealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DealFormData) => Promise<void>;
  deal?: Deal | null;
  title?: string;
  defaultStage?: DealStage;
}

export const DealModal = ({ isOpen, onClose, onSave, deal, title, defaultStage }: DealModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      stage: defaultStage || 'lead',
      priority: 'medium',
      probability: 50,
      value: 0,
    },
  });

  useEffect(() => {
    if (deal) {
      reset({
        title: deal.title,
        description: deal.description || '',
        value: deal.value,
        stage: deal.stage,
        priority: deal.priority,
        probability: deal.probability,
        contactName: deal.contactName || '',
        companyName: deal.companyName || '',
        expectedCloseDate: deal.expectedCloseDate || '',
        notes: deal.notes || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        value: 0,
        stage: defaultStage || 'lead',
        priority: 'medium',
        probability: 50,
        contactName: '',
        companyName: '',
        expectedCloseDate: '',
        notes: '',
      });
    }
  }, [deal, defaultStage, reset]);

  const handleFormSubmit = async (data: DealFormData) => {
    try {
      await onSave(data);
      onClose();
      reset();
    } catch (error) {
      console.error('Error saving deal:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {title || (deal ? 'Editar Negociação' : 'Nova Negociação')}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <Input
                  {...register('title')}
                  placeholder="Ex: Venda de software para empresa XYZ"
                  error={errors.title?.message}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalhes sobre a negociação..."
                />
              </div>

              {/* Valor, Probabilidade e Prioridade */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor (R$) *
                  </label>
                  <Input
                    {...register('value', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    error={errors.value?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Probabilidade (%) *
                  </label>
                  <Input
                    {...register('probability', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    error={errors.probability?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade *
                  </label>
                  <select
                    {...register('priority')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              {/* Estágio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estágio *
                </label>
                <select
                  {...register('stage')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lead">Lead</option>
                  <option value="qualified">Qualificado</option>
                  <option value="proposal">Proposta</option>
                  <option value="negotiation">Negociação</option>
                  <option value="won">Ganho</option>
                  <option value="lost">Perdido</option>
                </select>
              </div>

              {/* Contato e Empresa */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contato
                  </label>
                  <Input
                    {...register('contactName')}
                    placeholder="Nome do contato"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <Input
                    {...register('companyName')}
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>

              {/* Data Esperada de Fechamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Esperada de Fechamento
                </label>
                <Input
                  {...register('expectedCloseDate')}
                  type="date"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <textarea
                  {...register('notes')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observações sobre a negociação..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DealModal;
