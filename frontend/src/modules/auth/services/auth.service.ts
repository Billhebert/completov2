/**
 * Auth Service
 * Serviço para autenticação
 */

import api, { extractData } from '../../../core/utils/api';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RefreshTokenRequest,
} from '../types';

/**
 * Login
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post('/auth/login', data);
  return extractData(response);
};

/**
 * Registro
 */
export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
  const response = await api.post('/auth/register', data);
  return extractData(response);
};

/**
 * Setup 2FA
 */
export const setup2FA = async (): Promise<TwoFactorSetupResponse> => {
  const response = await api.post('/auth/2fa/setup');
  return extractData(response);
};

/**
 * Verificar 2FA
 */
export const verify2FA = async (
  data: TwoFactorVerifyRequest
): Promise<{ verified: boolean }> => {
  const response = await api.post('/auth/2fa/verify', data);
  return extractData(response);
};

/**
 * Habilitar 2FA
 */
export const enable2FA = async (
  data: TwoFactorVerifyRequest
): Promise<{ enabled: boolean }> => {
  const response = await api.post('/auth/2fa/enable', data);
  return extractData(response);
};

/**
 * Desabilitar 2FA
 */
export const disable2FA = async (): Promise<{ disabled: boolean }> => {
  const response = await api.post('/auth/2fa/disable');
  return extractData(response);
};

/**
 * Esqueci minha senha
 */
export const forgotPassword = async (
  data: ForgotPasswordRequest
): Promise<{ message: string }> => {
  const response = await api.post('/auth/forgot-password', data);
  return extractData(response);
};

/**
 * Resetar senha
 */
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<{ message: string }> => {
  const response = await api.post('/auth/reset-password', data);
  return extractData(response);
};

/**
 * Refresh token
 */
export const refreshToken = async (
  data: RefreshTokenRequest
): Promise<LoginResponse> => {
  const response = await api.post('/auth/refresh', data);
  return extractData(response);
};

/**
 * Obter perfil do usuário autenticado
 */
export const getMe = async (): Promise<LoginResponse['user']> => {
  const response = await api.get('/auth/me');
  return extractData(response);
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
};
