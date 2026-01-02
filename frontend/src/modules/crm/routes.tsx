/**
 * CRM Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const CrmListPage = lazy(() => import('./pages/CrmListPage'));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
const ContactDetailPage = lazy(() => import('./pages/ContactDetailPage'));
const DealsPage = lazy(() => import('./pages/DealsPage'));
const DealDetailPage = lazy(() => import('./pages/DealDetailPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const ActivitiesPage = lazy(() => import('./pages/ActivitiesPage'));
const InteractionsPage = lazy(() => import('./pages/InteractionsPage'));

export const crmRoutes: ProtectedRouteConfig[] = [
  {
    path: '/crm',
    element: <CrmListPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'CRM',
    },
  },
  {
    path: '/crm/contacts',
    element: <ContactsPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'Contatos - CRM',
    },
  },
  {
    path: '/crm/contacts/:id',
    element: <ContactDetailPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'Detalhes do Contato - CRM',
    },
  },
  {
    path: '/crm/deals',
    element: <DealsPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'Negociações - CRM',
    },
  },
  {
    path: '/crm/deals/:id',
    element: <DealDetailPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'Detalhes da Negociação - CRM',
    },
  },
  {
    path: '/crm/companies',
    element: <CompaniesPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'Empresas - CRM',
    },
  },
  {
    path: '/crm/activities',
    element: <ActivitiesPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'Atividades - CRM',
    },
  },
  {
    path: '/crm/interactions',
    element: <InteractionsPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'Interações - CRM',
    },
  },
];

export default crmRoutes;
