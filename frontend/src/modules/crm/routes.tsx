/**
 * CRM Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const CrmListPage = lazy(() => import('./pages/CrmListPage'));
const ContactsPage = lazy(() => import('./pages/ContactsPage'));
const DealsPage = lazy(() => import('./pages/DealsPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));

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
    path: '/crm/deals',
    element: <DealsPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'Negociações - CRM',
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
];

export default crmRoutes;
