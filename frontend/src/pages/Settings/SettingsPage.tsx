/**
 * Settings Page
 * Página de configurações do sistema
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout, Card, Button } from '../../modules/shared';
import { handleApiError } from '../../core/utils/api';
import api from '../../core/utils/api';

// Schema de validação de configurações
const settingsSchema = z.object({
  language: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyReport: z.boolean(),
  marketingEmails: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export const SettingsPage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
      emailNotifications: true,
      pushNotifications: true,
      weeklyReport: true,
      marketingEmails: false,
    },
  });

  const handleSettingsSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/users/settings', data);
      setSuccess('Configurações salvas com sucesso!');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    // TODO: Implementar dark mode no sistema
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const notificationSettings: NotificationSetting[] = [
    {
      id: 'emailNotifications',
      label: 'Notificações por Email',
      description: 'Receba atualizações importantes por email',
      enabled: watch('emailNotifications'),
    },
    {
      id: 'pushNotifications',
      label: 'Notificações Push',
      description: 'Receba notificações em tempo real no navegador',
      enabled: watch('pushNotifications'),
    },
    {
      id: 'weeklyReport',
      label: 'Relatório Semanal',
      description: 'Receba um resumo semanal das suas atividades',
      enabled: watch('weeklyReport'),
    },
    {
      id: 'marketingEmails',
      label: 'Emails de Marketing',
      description: 'Receba novidades e promoções',
      enabled: watch('marketingEmails'),
    },
  ];

  return (
    <AppLayout>
      <div className="page-container max-w-4xl mx-auto">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
            <p className="text-gray-600 mt-1">
              Gerencie as preferências do sistema
            </p>
          </div>
        </div>

        {/* Mensagens de Feedback */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit(handleSettingsSubmit)}>
          <div className="space-y-6">
            {/* Aparência */}
            <Card title="Aparência">
              <div className="space-y-4">
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Modo Escuro</p>
                    <p className="text-sm text-gray-600">
                      Altere a aparência do sistema para modo escuro
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDarkModeToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Idioma */}
                <div>
                  <label className="label">Idioma</label>
                  <select {...register('language')} className="input">
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Região e Formato */}
            <Card title="Região e Formato">
              <div className="space-y-4">
                {/* Fuso Horário */}
                <div>
                  <label className="label">Fuso Horário</label>
                  <select {...register('timezone')} className="input">
                    <option value="America/Sao_Paulo">
                      Brasília (GMT-3)
                    </option>
                    <option value="America/New_York">
                      Nova York (GMT-5)
                    </option>
                    <option value="Europe/London">Londres (GMT+0)</option>
                    <option value="Asia/Tokyo">Tóquio (GMT+9)</option>
                  </select>
                </div>

                {/* Formato de Data */}
                <div>
                  <label className="label">Formato de Data</label>
                  <select {...register('dateFormat')} className="input">
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Notificações */}
            <Card title="Notificações">
              <div className="space-y-3">
                {notificationSettings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        {...register(setting.id as keyof SettingsFormData)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                ))}
              </div>
            </Card>

            {/* Privacidade */}
            <Card title="Privacidade e Segurança">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Autenticação de Dois Fatores (2FA)
                    </p>
                    <p className="text-sm text-gray-600">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="sm">
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Sessões Ativas
                    </p>
                    <p className="text-sm text-gray-600">
                      Gerencie dispositivos conectados à sua conta
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="sm">
                    Visualizar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Download de Dados
                    </p>
                    <p className="text-sm text-gray-600">
                      Baixe uma cópia dos seus dados
                    </p>
                  </div>
                  <Button type="button" variant="secondary" size="sm">
                    Solicitar
                  </Button>
                </div>
              </div>
            </Card>

            {/* Integrações */}
            <Card title="Integrações">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Google Workspace</p>
                      <p className="text-sm text-gray-500">Não conectado</p>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" size="sm">
                    Conectar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Slack</p>
                      <p className="text-sm text-gray-500">Conectado</p>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" size="sm">
                    Desconectar
                  </Button>
                </div>
              </div>
            </Card>

            {/* Zona de Perigo */}
            <Card>
              <div className="border-2 border-red-200 rounded-lg p-6 bg-red-50">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Zona de Perigo
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Ações irreversíveis que afetam permanentemente sua conta
                </p>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" size="sm">
                    Desativar Conta
                  </Button>
                  <Button type="button" variant="secondary" size="sm">
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </Card>

            {/* Botão Salvar */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                size="lg"
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
