/**
 * Forgot Password Page - Enhanced
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card } from '../../shared';
import { forgotPassword } from '../services/auth.service';
import { handleApiError } from '../../../core/utils/api';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email é obrigatório').email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError('');
    setIsLoading(true);

    try {
      await forgotPassword({ email: data.email });
      setSuccess(true);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Esqueceu a senha?</h1>
          <p className="text-gray-600 mt-2">Digite seu email para receber instruções</p>
        </div>

        <Card className="shadow-xl">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email enviado!</h3>
              <p className="text-gray-600 mb-6">
                Verifique sua caixa de entrada para instruções de redefinição de senha.
              </p>
              <Link to="/login" className="btn-primary inline-block">Voltar para login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="label">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  className={`input ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="seu@email.com"
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>

              <Button type="submit" variant="primary" isLoading={isLoading} className="w-full">
                {isLoading ? 'Enviando...' : 'Enviar instruções'}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700">
                  Voltar para login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
