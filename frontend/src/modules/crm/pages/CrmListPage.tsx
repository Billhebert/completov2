import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../shared';
import * as contactService from '../services/contact.service';
import * as dealService from '../services/deal.service';
import {
  ChartBarIcon,
  Squares2X2Icon,
  HeartIcon,
  BellIcon,
  ChartPieIcon,
  ArrowsRightLeftIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function CrmListPage() {
  const [stats, setStats] = useState({
    contacts: 0,
    activeDeals: 0,
    pipeline: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [contactsRes, dealsRes] = await Promise.all([
          contactService.getContacts({ page: 1, limit: 500 }),
          dealService.getDeals({ page: 1, limit: 500 }),
        ]);

        const contacts = contactsRes?.data ?? [];
        const deals = dealsRes?.data ?? [];

        const active = deals.filter(
          (d: any) => !['won', 'lost'].includes(d.stage)
        );

        setStats({
          contacts: contacts.length,
          activeDeals: active.length,
          pipeline: active.reduce(
            (sum: number, d: any) => sum + (Number(d.value) || 0),
            0
          ),
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    load();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CRM</h1>
          <p className="text-lg text-gray-600">Gerencie seus contatos, deals e relacionamentos</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.contacts}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Contatos Totais</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <BriefcaseIcon className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stats.activeDeals}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Deals Ativos</h3>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pipeline)}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Valor do Pipeline</h3>
          </div>
        </div>

        {/* Premium Features */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/crm/dashboard"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dashboard Executivo</h3>
              <p className="text-sm text-gray-600">KPIs e métricas em tempo real</p>
            </Link>

            <Link
              to="/crm/kanban"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <Squares2X2Icon className="h-6 w-6 text-purple-600" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pipeline Kanban</h3>
              <p className="text-sm text-gray-600">Gestão visual drag & drop</p>
            </Link>

            <Link
              to="/crm/deal-health"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-red-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                  <HeartIcon className="h-6 w-6 text-red-600" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deal Health</h3>
              <p className="text-sm text-gray-600">Monitoramento de saúde</p>
            </Link>

            <Link
              to="/crm/analytics"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <ChartPieIcon className="h-6 w-6 text-green-600" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Avançado</h3>
              <p className="text-sm text-gray-600">Relatórios e previsões</p>
            </Link>

            <Link
              to="/crm/notifications"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-yellow-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-yellow-50 rounded-lg group-hover:bg-yellow-100 transition-colors">
                  <BellIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notificações</h3>
              <p className="text-sm text-gray-600">Alertas inteligentes</p>
            </Link>

            <Link
              to="/crm/import-export"
              className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                  <ArrowsRightLeftIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import/Export</h3>
              <p className="text-sm text-gray-600">Portabilidade de dados</p>
            </Link>
          </div>
        </div>

        {/* Core Features */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Gestão do CRM</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link
              to="/crm/contacts"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-green-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <UserGroupIcon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Contatos</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.contacts}</p>
            </Link>

            <Link
              to="/crm/deals"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Deals</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeDeals}</p>
            </Link>

            <Link
              to="/crm/companies"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-purple-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <BuildingOfficeIcon className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Empresas</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </Link>

            <Link
              to="/crm/activities"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-orange-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                  <CalendarIcon className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Atividades</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </Link>

            <Link
              to="/crm/interactions"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-pink-300 transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                  <ChatBubbleLeftIcon className="h-5 w-5 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Interações</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Comece Agora</h2>
            <p className="text-blue-100">Ações rápidas para impulsionar suas vendas</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/crm/deals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-sm"
            >
              <PlusIcon className="h-5 w-5" />
              Novo Deal
            </Link>
            <Link
              to="/crm/contacts"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Novo Contato
            </Link>
            <Link
              to="/crm/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-400 transition-colors"
            >
              <ChartBarIcon className="h-5 w-5" />
              Ver Dashboard
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
