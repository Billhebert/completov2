/**
 * Companies Page
 * Página de gestão de empresas/contas
 */

import { useState, useEffect } from 'react';
import { AppLayout, Card, Button, Breadcrumbs } from '../../shared';
import { Company, CompanyStatus, CompanySize } from '../types';
import * as companyService from '../services/company.service';
import { CompanyModal } from '../components';
import { handleApiError } from '../../../core/utils/api';

export const CompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | ''>('');
  const [sizeFilter, setSizeFilter] = useState<CompanySize | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadCompanies();
  }, [searchTerm, statusFilter, sizeFilter]);

  const loadCompanies = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await companyService.getCompanies({
        page: 1,
        limit: 50,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        size: sizeFilter || undefined,
      });
      setCompanies(result.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: CompanyStatus) => {
    const badges = {
      lead: 'bg-blue-100 text-blue-800',
      prospect: 'bg-yellow-100 text-yellow-800',
      customer: 'bg-green-100 text-green-800',
      partner: 'bg-purple-100 text-purple-800',
      inactive: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      lead: 'Lead',
      prospect: 'Prospect',
      customer: 'Cliente',
      partner: 'Parceiro',
      inactive: 'Inativo',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getSizeLabel = (size?: CompanySize) => {
    if (!size) return '-';
    const labels = {
      startup: 'Startup',
      small: 'Pequena',
      medium: 'Média',
      large: 'Grande',
      enterprise: 'Enterprise',
    };
    return labels[size];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleCreateCompany = () => {
    setEditingCompany(null);
    setIsModalOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const handleSaveCompany = async (data: any) => {
    try {
      if (editingCompany) {
        await companyService.updateCompany(editingCompany.id, data);
      } else {
        await companyService.createCompany(data);
      }
      await loadCompanies();
    } catch (err) {
      throw new Error(handleApiError(err));
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      return;
    }

    try {
      await companyService.deleteCompany(id);
      await loadCompanies();
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
            { label: 'Empresas' }
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
            <p className="text-gray-600 mt-1">
              Gerencie suas contas e empresas parceiras
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={handleCreateCompany}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Empresa
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <input
                  type="search"
                  placeholder="Nome, indústria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="label">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CompanyStatus | '')}
                className="input"
              >
                <option value="">Todos</option>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Cliente</option>
                <option value="partner">Parceiro</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            {/* Size Filter */}
            <div>
              <label className="label">Tamanho</label>
              <select
                value={sizeFilter}
                onChange={(e) => setSizeFilter(e.target.value as CompanySize | '')}
                className="input"
              >
                <option value="">Todos</option>
                <option value="startup">Startup</option>
                <option value="small">Pequena</option>
                <option value="medium">Média</option>
                <option value="large">Grande</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Companies Grid */}
        {isLoading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </Card>
        ) : companies.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma empresa encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando uma nova empresa.
              </p>
              <div className="mt-6">
                <Button variant="primary">
                  Criar primeira empresa
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Companies Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
                <Card key={company.id} className="hover:shadow-lg transition cursor-pointer">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {company.name}
                        </h3>
                        {company.industry && (
                          <p className="text-sm text-gray-600">{company.industry}</p>
                        )}
                      </div>
                      {getStatusBadge(company.status)}
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      {/* Website */}
                      {company.website && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                            {company.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}

                      {/* Email */}
                      {company.email && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline truncate">
                            {company.email}
                          </a>
                        </div>
                      )}

                      {/* Phone */}
                      {company.phone && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {company.phone}
                        </div>
                      )}

                      {/* Size */}
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Porte: {getSizeLabel(company.size)}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {company.contactsCount || 0}
                          </div>
                          <div className="text-xs text-gray-500">Contatos</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {company.dealsCount || 0}
                          </div>
                          <div className="text-xs text-gray-500">Deals</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {company.totalValue ? formatCurrency(company.totalValue) : '-'}
                          </div>
                          <div className="text-xs text-gray-500">Valor</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        className="flex-1 btn-secondary text-sm"
                        onClick={() => handleEditCompany(company)}
                      >
                        Ver Detalhes
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-blue-600 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCompany(company);
                        }}
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-red-600 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompany(company.id);
                        }}
                        title="Excluir"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
                  <div className="text-sm text-gray-600">Total de Empresas</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {companies.filter(c => c.status === 'customer').length}
                  </div>
                  <div className="text-sm text-gray-600">Clientes</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {companies.filter(c => c.status === 'partner').length}
                  </div>
                  <div className="text-sm text-gray-600">Parceiros</div>
                </div>
              </Card>
              <Card>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {companies.reduce((sum, c) => sum + (c.contactsCount || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Contatos Total</div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Company Modal */}
        <CompanyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCompany}
          company={editingCompany}
        />
      </div>
    </AppLayout>
  );
};

export default CompaniesPage;
