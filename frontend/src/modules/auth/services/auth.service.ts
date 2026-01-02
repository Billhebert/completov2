import api from '../../../core/utils/api';

/**
 * Authentication service
 *
 * Wraps the authentication endpoints exposed by the backend. These
 * endpoints allow new companies to register, users to log in and out,
 * refresh their access tokens, manage two-factor authentication (2FA)
 * and retrieve the currently authenticated user. See the backend auth
 * routes for details【230118662508263†L21-L91】.
 */

export interface LoginPayload {
  email: string;
  password: string;
  code2FA?: string;
}

export interface RegisterPayload {
  /**
   * E-mail do usuário administrador da nova conta. Deve ser único.
   */
  email: string;
  /**
   * Senha do usuário administrador. Pelo menos 8 caracteres conforme esquema do backend【194810927977408†L13-L18】.
   */
  password: string;
  /**
   * Nome completo do usuário administrador (campo `name` no backend). É obrigatório【194810927977408†L13-L18】.
   */
  name: string;
  /**
   * Nome da empresa a ser criada. Será armazenado na tabela `companies`【142012959897500†L122-L126】.
   */
  companyName: string;
  /**
   * Domínio da empresa (somente letras minúsculas, números e hífens). Deve ser único no banco【142012959897500†L109-L116】.
   */
  companyDomain: string;
  /** Campos adicionais são permitidos mas serão ignorados pelo backend. */
  [key: string]: any;
}

class AuthService {
  private baseUrl = '/auth';

  /**
   * Perform login with email and password. Optionally pass a 2FA code if
   * the account has 2FA enabled【230118662508263†L21-L37】.
   */
  async login(payload: LoginPayload) {
    const response = await api.post(`${this.baseUrl}/login`, payload);
    return response.data.data;
  }

  /**
   * Register a new company and its admin user【230118662508263†L40-L50】.
   */
  async register(payload: RegisterPayload) {
    const response = await api.post(`${this.baseUrl}/register`, payload);
    return response.data.data;
  }

  /**
   * Refresh the access token using a valid refresh token【230118662508263†L58-L69】.
   */
  async refreshToken(refreshToken: string) {
    const response = await api.post(`${this.baseUrl}/refresh`, { refreshToken });
    return response.data.data;
  }

  /**
   * Get current user info. Requires authentication【230118662508263†L76-L90】.
   */
  async getMe() {
    const response = await api.get(`${this.baseUrl}/me`);
    return response.data.data;
  }

  /**
   * Setup two-factor authentication. Pass the current password to
   * generate a secret and QR code【230118662508263†L96-L107】.
   */
  async setup2FA(password: string) {
    const response = await api.post(`${this.baseUrl}/2fa/setup`, { password });
    return response.data.data;
  }

  /**
   * Verify a 2FA token and enable it on the account【230118662508263†L111-L124】.
   */
  async verify2FA(token: string) {
    const response = await api.post(`${this.baseUrl}/2fa/verify`, { token });
    return response.data.data;
  }

  /**
   * Disable 2FA by providing the current password and a valid 2FA token【230118662508263†L131-L146】.
   */
  async disable2FA(payload: { password: string; token: string }) {
    const response = await api.post(`${this.baseUrl}/2fa/disable`, payload);
    return response.data.data;
  }

  /**
   * Logout the current user. This simply returns success; token
   * invalidation is handled client-side or via a token blacklist【230118662508263†L149-L160】.
   */
  async logout() {
    const response = await api.post(`${this.baseUrl}/logout`);
    return response.data;
  }
}

export const authService = new AuthService();
export default authService;

// Named exports for functional usage in pages
/**
 * Realiza login com email/senha e opcionalmente código 2FA【230118662508263†L21-L37】.
 */
export const login = (payload: LoginPayload) => authService.login(payload);

/**
 * Registra uma nova empresa e usuário administrador【230118662508263†L40-L50】.
 */
export const register = (payload: RegisterPayload) => authService.register(payload);

/**
 * Solicita a troca do token de acesso usando um token de atualização válido【230118662508263†L58-L69】.
 */
export const refreshToken = (refreshToken: string) => authService.refreshToken(refreshToken);

/**
 * Recupera os dados do usuário autenticado【230118662508263†L76-L90】.
 */
export const getMe = () => authService.getMe();

/**
 * Inicia a configuração de 2FA, retornando o QR code e segredo【230118662508263†L96-L107】.
 */
export const setup2FA = (password: string) => authService.setup2FA(password);

/**
 * Verifica o código 2FA e habilita o segundo fator【230118662508263†L111-L124】.
 */
export const verify2FA = (token: string) => authService.verify2FA(token);

/**
 * Desativa o 2FA fornecendo senha e token【230118662508263†L131-L146】.
 */
export const disable2FA = (payload: { password: string; token: string }) => authService.disable2FA(payload);

/**
 * Efetua logout do usuário【230118662508263†L149-L160】.
 */
export const logout = () => authService.logout();

/**
 * Envia um email com instruções de redefinição de senha.
 *
 * Embora o backend atual não exponha explicitamente essa rota, utilizamos a
 * convenção padrão `/auth/forgot-password`. Ajuste conforme a implementação real.
 *
 * @param payload Objeto contendo o email do usuário.
 * @returns Objeto de resposta do backend.
 */
export const forgotPassword = async (payload: { email: string }): Promise<any> => {
  const response = await api.post('/auth/forgot-password', payload);
  return response.data;
};