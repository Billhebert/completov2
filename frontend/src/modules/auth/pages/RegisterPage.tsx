/**
 * Register Page - Enhanced
 * Página de cadastro com validação Zod e melhor UX
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card } from '../../shared';
import { register as registerUser } from '../services/auth.service';
import { handleApiError, setAuthToken } from '../../../core/utils/api';
import { STORAGE_KEYS } from '../../../core/utils/constants';

// Schema de validação
const registerSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  companyName: z
    .string()
    .min(2, 'Nome da empresa deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória'),
  termsAccepted: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Você deve aceitar os termos de serviço',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      companyName: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
    },
  });

  const password = watch('password');

  // Validações de senha em tempo real
  const passwordStrength = {
    hasMinLength: password?.length >= 8,
    hasUpperCase: /[A-Z]/.test(password || ''),
    hasLowerCase: /[a-z]/.test(password || ''),
    hasNumber: /[0-9]/.test(password || ''),
  };

  const onSubmit = async (data: RegisterFormData) => {
    setApiError('');
    setIsLoading(true);

    try {
      const response = await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
      });

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      setAuthToken(response.accessToken);

      navigate('/dashboard');
    } catch (err) {
      setApiError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Criar Conta</h1>
          <p className="text-gray-600 mt-2">Comece sua jornada gratuitamente</p>
        </div>

        {/* Register Card */}
        <Card className="shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* API Error */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start text-sm">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="label">Nome completo</label>
              <input
                {...register('name')}
                type="text"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="João Silva"
                autoComplete="name"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                {...register('email')}
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="joao@empresa.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="label">Nome da empresa</label>
              <input
                {...register('companyName')}
                type="text"
                className={`input ${errors.companyName ? 'border-red-500' : ''}`}
                placeholder="Minha Empresa Ltda"
                autoComplete="organization"
              />
              {errors.companyName && (
                <p className="form-error">{errors.companyName.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Senha</label>
              <input
                {...register('password')}
                type="password"
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasMinLength ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasMinLength ? 'text-green-700' : 'text-gray-500'}>
                      Mínimo 8 caracteres
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasUpperCase ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasUpperCase ? 'text-green-700' : 'text-gray-500'}>
                      Letra maiúscula
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasLowerCase ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasLowerCase ? 'text-green-700' : 'text-gray-500'}>
                      Letra minúscula
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={passwordStrength.hasNumber ? 'text-green-700' : 'text-gray-500'}>
                      Número
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirmar senha</label>
              <input
                {...register('confirmPassword')}
                type="password"
                className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="form-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div>
              <label className="flex items-start cursor-pointer">
                <input
                  {...register('termsAccepted')}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-1"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Eu aceito os{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Termos de Serviço
                  </a>
                  {' e '}
                  <a href="#" className="text-blue-600 hover:text-blue-700">
                    Política de Privacidade
                  </a>
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="form-error">{errors.termsAccepted.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full text-base py-3"
            >
              {isLoading ? 'Criando conta...' : 'Criar conta grátis'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Faça login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
