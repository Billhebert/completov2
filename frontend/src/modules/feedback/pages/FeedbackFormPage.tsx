/**
 * Feedback Form Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../shared';
import * as feedbackService from '../services/feedback.service';
import type { Feedback } from '../types';
import {
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export default function FeedbackFormPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'general' as Feedback['type'],
    subject: '',
    message: '',
    priority: 'medium' as Feedback['priority'],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'O assunto é obrigatório';
    } else if (formData.subject.trim().length < 5) {
      newErrors.subject = 'O assunto deve ter pelo menos 5 caracteres';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'A mensagem é obrigatória';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'A mensagem deve ter pelo menos 10 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackService.createFeedback(formData);
      navigate('/feedback');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setErrors({ submit: 'Erro ao enviar feedback. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/feedback')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Voltar
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Enviar Feedback</h1>
              <p className="text-lg text-gray-600">Compartilhe suas ideias, reporte bugs ou faça perguntas</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Type */}
            <div className="mb-6">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Feedback *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">Geral</option>
                <option value="bug">Bug / Erro</option>
                <option value="feature">Nova Funcionalidade</option>
                <option value="improvement">Melhoria</option>
                <option value="question">Pergunta</option>
              </select>
            </div>

            {/* Priority */}
            <div className="mb-6">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade *
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                Use "Crítica" apenas para bugs que impedem o uso do sistema
              </p>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Assunto *
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                placeholder="Ex: Erro ao salvar contato, Sugestão de novo filtro..."
                className={`w-full px-4 py-3 border ${
                  errors.subject ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.subject && <p className="mt-2 text-sm text-red-600">{errors.subject}</p>}
            </div>

            {/* Message */}
            <div className="mb-6">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem *
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Descreva em detalhes seu feedback. Quanto mais informações, melhor poderemos ajudar!"
                rows={8}
                className={`w-full px-4 py-3 border ${
                  errors.message ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              />
              {errors.message && <p className="mt-2 text-sm text-red-600">{errors.message}</p>}
              <p className="mt-2 text-sm text-gray-500">
                Para bugs, inclua passos para reproduzir o problema
              </p>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/feedback')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5" />
                  Enviar Feedback
                </>
              )}
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Dicas para um bom feedback</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Seja específico:</strong> Descreva exatamente o que aconteceu e onde</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Passos para reproduzir:</strong> Para bugs, liste os passos que causam o problema</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Screenshots:</strong> Se possível, inclua capturas de tela na descrição</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span><strong>Impacto:</strong> Explique como isso afeta seu trabalho</span>
            </li>
          </ul>
        </div>
      </div>
    </AppLayout>
  );
}
