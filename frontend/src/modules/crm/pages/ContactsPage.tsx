/**
 * Contacts Page
 * Página de gestão de contatos do CRM
 */

import { useState, useEffect } from 'react';
import { AppLayout, Card, Button, Breadcrumbs } from '../../shared';
import { Contact, ContactStatus, ContactSource } from '../types';
import * as contactService from '../services/contact.service';
import { ContactModal } from '../components';
import { handleApiError } from '../../../core/utils/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const ContactsPage = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<ContactSource | ''>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    loadContacts();
  }, [searchTerm, statusFilter, sourceFilter]);

  const loadContacts = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await contactService.getContacts({
        page: 1,
        limit: 50,
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
      });
      setContacts(result.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: ContactStatus) => {
    const badges = {
      lead: 'bg-blue-100 text-blue-800',
      prospect: 'bg-yellow-100 text-yellow-800',
      customer: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      lead: 'Lead',
      prospect: 'Prospect',
      customer: 'Cliente',
      inactive: 'Inativo',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getSourceLabel = (source: ContactSource) => {
    const labels = {
      website: 'Website',
      referral: 'Indicação',
      social: 'Redes Sociais',
      email: 'Email',
      phone: 'Telefone',
      event: 'Evento',
      other: 'Outro',
    };
    return labels[source];
  };

  const handleCreateContact = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleSaveContact = async (data: any) => {
    try {
      if (editingContact) {
        await contactService.updateContact(editingContact.id, data);
      } else {
        await contactService.createContact(data);
      }
      await loadContacts();
    } catch (err) {
      throw new Error(handleApiError(err));
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) {
      return;
    }

    try {
      await contactService.deleteContact(id);
      await loadContacts();
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
            { label: 'Contatos' }
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
            <p className="text-gray-600 mt-1">
              Gerencie seus contatos e leads
            </p>
          </div>
          <div>
            <Button variant="primary" onClick={handleCreateContact}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Contato
            </Button>
          </div>
        </div>

        {/* Error Message */}
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
                  placeholder="Nome, email, telefone..."
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
                onChange={(e) => setStatusFilter(e.target.value as ContactStatus | '')}
                className="input"
              >
                <option value="">Todos</option>
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Cliente</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="label">Origem</label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as ContactSource | '')}
                className="input"
              >
                <option value="">Todas</option>
                <option value="website">Website</option>
                <option value="referral">Indicação</option>
                <option value="social">Redes Sociais</option>
                <option value="email">Email</option>
                <option value="phone">Telefone</option>
                <option value="event">Evento</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Contacts Table */}
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : contacts.length === 0 ? (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum contato encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando um novo contato.
              </p>
              <div className="mt-6">
                <Button variant="primary" onClick={handleCreateContact}>
                  Criar primeiro contato
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Empresa</th>
                    <th>Status</th>
                    <th>Origem</th>
                    <th>Última Interação</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium mr-3">
                            {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {contact.firstName} {contact.lastName}
                            </div>
                            {contact.position && (
                              <div className="text-sm text-gray-500">{contact.position}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800">
                          {contact.email}
                        </a>
                      </td>
                      <td className="text-gray-600">{contact.phone || contact.mobile || '-'}</td>
                      <td className="text-gray-600">{contact.companyName || '-'}</td>
                      <td>{getStatusBadge(contact.status)}</td>
                      <td className="text-gray-600">{getSourceLabel(contact.source)}</td>
                      <td className="text-gray-500 text-sm">
                        {contact.lastContactDate
                          ? formatDistanceToNow(new Date(contact.lastContactDate), {
                              addSuffix: true,
                              locale: ptBR,
                            })
                          : 'Nunca'}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="p-1 text-gray-400 hover:text-blue-600 transition"
                            title="Editar"
                            onClick={() => handleEditContact(contact)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-red-600 transition"
                            title="Excluir"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Stats Summary */}
        {!isLoading && contacts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{contacts.length}</div>
                <div className="text-sm text-gray-600">Total de Contatos</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {contacts.filter(c => c.status === 'lead').length}
                </div>
                <div className="text-sm text-gray-600">Leads</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {contacts.filter(c => c.status === 'prospect').length}
                </div>
                <div className="text-sm text-gray-600">Prospects</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {contacts.filter(c => c.status === 'customer').length}
                </div>
                <div className="text-sm text-gray-600">Clientes</div>
              </div>
            </Card>
          </div>
        )}

        {/* Contact Modal */}
        <ContactModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveContact}
          contact={editingContact}
        />
      </div>
    </AppLayout>
  );
};

export default ContactsPage;
