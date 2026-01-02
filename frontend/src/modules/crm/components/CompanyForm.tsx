import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button, Input } from '../../shared';
import { Company } from '../types';

export const companySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  industry: z.string().optional(),
  size: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  status: z.enum(['lead', 'prospect', 'customer', 'partner', 'inactive']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
});

export type CompanyFormData = z.infer<typeof companySchema>;

type Props = {
  company?: Company | null;
  title?: string;
  onCancel: () => void;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  submitLabel?: string;
  isEmbedded?: boolean;
};

export function CompanyForm({
  company,
  title,
  onCancel,
  onSubmit,
  submitLabel = 'Salvar',
  isEmbedded,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: { status: 'lead' },
  });

  useEffect(() => {
    if (company) {
      const addr: any = (company as any).address ?? {};
      reset({
        name: company.name,
        website: (company as any).website || '',
        industry: (company as any).industry || '',
        size: (company as any).size,
        status: (company as any).status,
        email: (company as any).email || '',
        phone: (company as any).phone || '',
        street: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        zipCode: addr.zipCode || '',
        country: addr.country || 'Brasil',
        notes: (company as any).notes || '',
      });
    } else {
      reset({
        name: '',
        website: '',
        industry: '',
        size: undefined,
        status: 'lead',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Brasil',
        notes: '',
      });
    }
  }, [company, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={isEmbedded ? '' : 'bg-white'}>
      {!isEmbedded && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {title || (company ? 'Editar Empresa' : 'Nova Empresa')}
          </h3>
        </div>
      )}

      <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 uppercase">Informações Básicas</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
            <Input {...register('name')} placeholder="Ex: Empresa XYZ Ltda" error={errors.name?.message} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <Input
                {...register('website')}
                type="url"
                placeholder="https://exemplo.com"
                error={errors.website?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segmento</label>
              <Input {...register('industry')} placeholder="Ex: Tecnologia" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Porte</label>
              <select
                {...register('size')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                <option value="startup">Startup</option>
                <option value="small">Pequena</option>
                <option value="medium">Média</option>
                <option value="large">Grande</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Cliente</option>
                <option value="partner">Parceiro</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 uppercase">Contato</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input {...register('email')} type="email" placeholder="contato@empresa.com" error={errors.email?.message} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <Input {...register('phone')} placeholder="(11) 99999-9999" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 uppercase">Endereço</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
            <Input {...register('street')} placeholder="Rua Exemplo, 123" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <Input {...register('city')} placeholder="São Paulo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <Input {...register('state')} placeholder="SP" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <Input {...register('zipCode')} placeholder="01234-567" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <Input {...register('country')} placeholder="Brasil" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            {...register('notes')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observações sobre a empresa..."
          />
        </div>
      </div>

      <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 sticky bottom-0">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
