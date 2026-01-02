/**
 * Feedback List Page
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../shared';
import * as feedbackService from '../services/feedback.service';
import type { Feedback, FeedbackFilters } from '../types';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function FeedbackListPage() {
  const navigate = useNavigate();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FeedbackFilters>({});

  useEffect(() => {
    loadFeedback();
  }, [filters]);

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const data = await feedbackService.listFeedback(filters);
      setFeedbackList(data);
    } catch (error) {
      console.error('Failed to load feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      case 'closed':
        return <XCircleIcon className="h-5 w-5 text-gray-600" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bug: 'Bug',
      feature: 'Feature',
      improvement: 'Melhoria',
      question: 'Pergunta',
      general: 'Geral',
    };
    return labels[type] || type;
  };

  const stats = {
    total: feedbackList.length,
    open: feedbackList.filter((f) => f.status === 'open').length,
    inProgress: feedbackList.filter((f) => f.status === 'in-progress').length,
    resolved: feedbackList.filter((f) => f.status === 'resolved').length,
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Feedback</h1>
            <p className="text-lg text-gray-600">Gerencie sugestões, bugs e melhorias</p>
          </div>
          <Link
            to="/feedback/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Novo Feedback
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total</span>
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Abertos</span>
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">{stats.open}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Em Progresso</span>
              <ClockIcon className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Resolvidos</span>
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os Status</option>
                <option value="open">Abertos</option>
                <option value="in-progress">Em Progresso</option>
                <option value="resolved">Resolvidos</option>
                <option value="closed">Fechados</option>
              </select>

              <select
                value={filters.type || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os Tipos</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
                <option value="improvement">Melhoria</option>
                <option value="question">Pergunta</option>
                <option value="general">Geral</option>
              </select>

              <select
                value={filters.priority || ''}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as Prioridades</option>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>

              {(filters.status || filters.type || filters.priority) && (
                <button
                  onClick={() => setFilters({})}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Feedback List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando feedback...</p>
          </div>
        ) : feedbackList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum feedback encontrado</h3>
            <p className="text-gray-600 mb-6">
              {filters.status || filters.type || filters.priority
                ? 'Tente ajustar os filtros'
                : 'Comece enviando seu primeiro feedback'}
            </p>
            <Link
              to="/feedback/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Enviar Feedback
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((feedback) => (
              <div
                key={feedback.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(feedback.status)}
                      <h3 className="text-lg font-semibold text-gray-900">{feedback.subject}</h3>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{feedback.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      feedback.status
                    )}`}
                  >
                    {feedback.status}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                      feedback.priority
                    )}`}
                  >
                    {feedback.priority}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    {getTypeLabel(feedback.type)}
                  </span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {new Date(feedback.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {feedback.response && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Resposta:</p>
                    <p className="text-sm text-gray-600">{feedback.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
