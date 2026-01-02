import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../shared';
import * as contactService from '../services/contact.service';
import * as dealService from '../services/deal.service';
import {
  ChartBarIcon,
  RectangleStackIcon,
  HeartIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ChartPieIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

export default function CrmListPage() {
  const [stats, setStats] = useState({
    contacts: 0,
    activeDeals: 0,
    pipeline: 0,
  });

  useEffect(() => {
    const load = async () => {
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

  const premiumFeatures = [
    {
      to: '/crm/dashboard',
      title: 'Dashboard Executivo',
      description: 'KPIs, métricas e insights em tempo real',
      icon: ChartBarIcon,
      gradient: 'from-blue-500 to-blue-700',
      badge: 'Premium',
    },
    {
      to: '/crm/kanban',
      title: 'Kanban Board',
      description: 'Gestão visual com drag & drop',
      icon: RectangleStackIcon,
      gradient: 'from-purple-500 to-purple-700',
      badge: 'Premium',
    },
    {
      to: '/crm/deal-health',
      title: 'Deal Health',
      description: 'Monitoramento proativo de deals',
      icon: HeartIcon,
      gradient: 'from-red-500 to-red-700',
      badge: 'Premium',
    },
    {
      to: '/crm/notifications',
      title: 'Notificações',
      description: 'Central de alertas inteligentes',
      icon: BellIcon,
      gradient: 'from-yellow-500 to-yellow-700',
      badge: 'New',
    },
    {
      to: '/crm/analytics',
      title: 'Analytics Avançado',
      description: 'Relatórios e previsões de receita',
      icon: ChartPieIcon,
      gradient: 'from-green-500 to-green-700',
      badge: 'New',
    },
    {
      to: '/crm/import-export',
      title: 'Import/Export',
      description: 'Portabilidade completa de dados',
      icon: ArrowsRightLeftIcon,
      gradient: 'from-indigo-500 to-indigo-700',
      badge: 'New',
    },
  ];

  const coreFeatures = [
    {
      to: '/crm/contacts',
      title: 'Contatos',
      count: stats.contacts,
      icon: UserGroupIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      to: '/crm/deals',
      title: 'Deals',
      count: stats.activeDeals,
      icon: BriefcaseIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      to: '/crm/companies',
      title: 'Empresas',
      count: '-',
      icon: BuildingOfficeIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      to: '/crm/activities',
      title: 'Atividades',
      count: '-',
      icon: CalendarIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      to: '/crm/interactions',
      title: 'Interações',
      count: '-',
      icon: ChatBubbleLeftIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative px-6 py-16 sm:py-24">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <SparklesIcon className="h-10 w-10 animate-pulse" />
                <h1 className="text-5xl font-extrabold tracking-tight">
                  CRM Premium
                </h1>
              </div>
              <p className="text-xl text-blue-100 max-w-3xl">
                Plataforma empresarial completa com IA, analytics avançados e automações inteligentes
              </p>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold">{stats.contacts}</div>
                  <div className="text-blue-100 mt-1">Contatos Totais</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold">{stats.activeDeals}</div>
                  <div className="text-blue-100 mt-1">Deals Ativos</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <div className="text-3xl font-bold">{formatCurrency(stats.pipeline)}</div>
                  <div className="text-blue-100 mt-1">Valor do Pipeline</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Premium Features */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Funcionalidades Premium
                </h2>
                <p className="text-gray-600 mt-1">
                  Features avançadas para impulsionar suas vendas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumFeatures.map((feature) => (
                <Link
                  key={feature.to}
                  to={feature.to}
                  className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                  {/* Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      feature.badge === 'Premium'
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'
                        : 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                    }`}>
                      {feature.badge}
                    </span>
                  </div>

                  <div className="relative p-6">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>

                    {/* Arrow */}
                    <div className="mt-4 flex items-center text-sm font-semibold text-blue-600 group-hover:text-purple-600 transition-colors">
                      Explorar
                      <svg className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Core Features */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Gestão Essencial
                </h2>
                <p className="text-gray-600 mt-1">
                  Funcionalidades core do CRM
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {coreFeatures.map((feature) => (
                <Link
                  key={feature.to}
                  to={feature.to}
                  className="group bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-blue-500"
                >
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-700">
                    {feature.count}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                Atalhos Rápidos
              </h2>
              <p className="text-blue-100 mb-8">
                Acesse rapidamente as funcionalidades mais usadas
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/crm/dashboard"
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  📊 Ver Dashboard
                </Link>
                <Link
                  to="/crm/kanban"
                  className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  🎨 Kanban Board
                </Link>
                <button
                  onClick={() => {
                    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                    document.dispatchEvent(event);
                  }}
                  className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  🔍 Buscar (⌘K)
                </button>
                <Link
                  to="/crm/notifications"
                  className="px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  🔔 Notificações
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
