/**
 * CRM List Page
 * Página de visão geral do CRM com links para módulos
 */

import { Link } from 'react-router-dom';
import { AppLayout, Card, Breadcrumbs } from '../../shared';

export const CrmListPage = () => {
  const crmModules = [
    {
      title: 'Contatos',
      description: 'Gerencie seus contatos e leads',
      path: '/crm/contacts',
      icon: (
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Negociações',
      description: 'Gerencie seu pipeline de vendas',
      path: '/crm/deals',
      icon: (
        <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Empresas',
      description: 'Gerencie empresas e contas',
      path: '/crm/companies',
      icon: (
        <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <AppLayout>
      <div className="page-container">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[{ label: 'CRM' }]}
          className="mb-4"
        />

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
            <p className="text-gray-600 mt-1">
              Customer Relationship Management - Gerencie seus relacionamentos com clientes
            </p>
          </div>
        </div>

        {/* CRM Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {crmModules.map((module) => (
            <Link key={module.path} to={module.path}>
              <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
                <div className="text-center space-y-4">
                  <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${module.color} flex items-center justify-center shadow-lg`}>
                    {module.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{module.title}</h3>
                    <p className="text-gray-600 mt-2">{module.description}</p>
                  </div>
                  <div className="pt-4">
                    <span className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center">
                      Acessar
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Visão Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">-</div>
                <div className="text-sm text-gray-600 mt-1">Total de Contatos</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">-</div>
                <div className="text-sm text-gray-600 mt-1">Negociações Ativas</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">-</div>
                <div className="text-sm text-gray-600 mt-1">Empresas Cadastradas</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">-</div>
                <div className="text-sm text-gray-600 mt-1">Valor do Pipeline</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CrmListPage;
