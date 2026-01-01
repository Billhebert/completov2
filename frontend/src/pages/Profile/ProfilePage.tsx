/**
 * Profile Page
 * Página de perfil do usuário com edição de dados
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../core/providers/AuthProvider';
import { AppLayout, Card, Button, Breadcrumbs } from '../../modules/shared';
import { handleApiError } from '../../core/utils/api';
import api from '../../core/utils/api';

// Schema de validação do perfil
const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
});

// Schema de validação de senha
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
      .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
      .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form para edição de perfil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      position: user?.position || '',
    },
  });

  // Form para mudança de senha
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/users/profile', data);
      await refreshUser();
      setSuccess('Perfil atualizado com sucesso!');
      setIsEditingProfile(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsSavingPassword(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess('Senha alterada com sucesso!');
      setIsEditingPassword(false);
      resetPassword();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleCancelProfile = () => {
    setIsEditingProfile(false);
    resetProfile({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: user?.company || '',
      position: user?.position || '',
    });
  };

  const handleCancelPassword = () => {
    setIsEditingPassword(false);
    resetPassword();
  };

  return (
    <AppLayout>
      <div className="page-container max-w-4xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-4" />

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
            <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
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

        <div className="space-y-6">
          {/* Avatar e Info Básica */}
          <Card>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user?.role}
                  </span>
                  {user?.company && (
                    <span className="text-sm text-gray-500">• {user.company}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Informações do Perfil */}
          <Card title="Informações Pessoais">
            <form onSubmit={handleSubmitProfile(handleProfileSubmit)}>
              <div className="space-y-4">
                {/* Nome */}
                <div>
                  <label className="label">Nome Completo *</label>
                  <input
                    {...registerProfile('name')}
                    type="text"
                    disabled={!isEditingProfile}
                    className={`input ${profileErrors.name ? 'border-red-500' : ''} ${
                      !isEditingProfile ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                  />
                  {profileErrors.name && (
                    <p className="form-error">{profileErrors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="label">Email *</label>
                  <input
                    {...registerProfile('email')}
                    type="email"
                    disabled={!isEditingProfile}
                    className={`input ${profileErrors.email ? 'border-red-500' : ''} ${
                      !isEditingProfile ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                  />
                  {profileErrors.email && (
                    <p className="form-error">{profileErrors.email.message}</p>
                  )}
                </div>

                {/* Telefone */}
                <div>
                  <label className="label">Telefone</label>
                  <input
                    {...registerProfile('phone')}
                    type="tel"
                    disabled={!isEditingProfile}
                    className={`input ${
                      !isEditingProfile ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="label">Empresa</label>
                  <input
                    {...registerProfile('company')}
                    type="text"
                    disabled={!isEditingProfile}
                    className={`input ${
                      !isEditingProfile ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Cargo */}
                <div>
                  <label className="label">Cargo</label>
                  <input
                    {...registerProfile('position')}
                    type="text"
                    disabled={!isEditingProfile}
                    className={`input ${
                      !isEditingProfile ? 'bg-gray-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  {!isEditingProfile ? (
                    <Button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      variant="primary"
                    >
                      Editar Perfil
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSavingProfile}
                      >
                        Salvar Alterações
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCancelProfile}
                        variant="secondary"
                        disabled={isSavingProfile}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </Card>

          {/* Segurança - Alterar Senha */}
          <Card title="Segurança">
            {!isEditingPassword ? (
              <div>
                <p className="text-gray-600 mb-4">
                  Mantenha sua conta segura alterando sua senha regularmente.
                </p>
                <Button
                  onClick={() => setIsEditingPassword(true)}
                  variant="secondary"
                >
                  Alterar Senha
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPassword(handlePasswordSubmit)}>
                <div className="space-y-4">
                  {/* Senha Atual */}
                  <div>
                    <label className="label">Senha Atual *</label>
                    <input
                      {...registerPassword('currentPassword')}
                      type="password"
                      className={`input ${
                        passwordErrors.currentPassword ? 'border-red-500' : ''
                      }`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="form-error">
                        {passwordErrors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Nova Senha */}
                  <div>
                    <label className="label">Nova Senha *</label>
                    <input
                      {...registerPassword('newPassword')}
                      type="password"
                      className={`input ${
                        passwordErrors.newPassword ? 'border-red-500' : ''
                      }`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="form-error">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div>
                    <label className="label">Confirmar Nova Senha *</label>
                    <input
                      {...registerPassword('confirmPassword')}
                      type="password"
                      className={`input ${
                        passwordErrors.confirmPassword ? 'border-red-500' : ''
                      }`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="form-error">
                        {passwordErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Requisitos de Senha */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Requisitos de senha:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Mínimo de 8 caracteres</li>
                      <li>• Pelo menos uma letra maiúscula</li>
                      <li>• Pelo menos uma letra minúscula</li>
                      <li>• Pelo menos um número</li>
                    </ul>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSavingPassword}
                    >
                      Alterar Senha
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCancelPassword}
                      variant="secondary"
                      disabled={isSavingPassword}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </Card>

          {/* Informações da Conta */}
          <Card title="Informações da Conta">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">ID do Usuário</span>
                <span className="font-mono text-sm text-gray-900">{user?.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Data de Criação</span>
                <span className="text-gray-900">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Último Acesso</span>
                <span className="text-gray-900">
                  {user?.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
