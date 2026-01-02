// src/modules/crm/pages/CrmListPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout, Card, Breadcrumbs } from '../../shared';
import * as contactService from '../services/contact.service';
import * as dealService from '../services/deal.service';

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

  return (
    <AppLayout>
      <div className="page-container">
        <Breadcrumbs items={[{ label: 'CRM' }]} className="mb-4" />

        <h1 className="text-3xl font-bold mb-6">CRM</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/crm/contacts">
            <Card>
              <h3 className="text-xl font-semibold">Contatos</h3>
              <p>{stats.contacts} contatos</p>
            </Card>
          </Link>

          <Link to="/crm/deals">
            <Card>
              <h3 className="text-xl font-semibold">Negociações</h3>
              <p>{stats.activeDeals} ativas</p>
            </Card>
          </Link>

          <Link to="/crm/companies">
            <Card>
              <h3 className="text-xl font-semibold">Empresas</h3>
              <p>Gerenciar empresas</p>
            </Card>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
