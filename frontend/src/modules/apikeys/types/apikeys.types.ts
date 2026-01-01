/**
 * API Keys Types
 * Alinhado ao backend (create: name + scopes + expiresAt)
 */

export interface ApiKey {
  id: string;
  name: string;

  /**
   * IMPORTANTE: idealmente o backend não deveria retornar o "key" completo em listagem.
   * Mas se retornar (como seu type antigo sugeria), deixamos opcional.
   */
  key?: string;

  /**
   * Prefixo seguro (ex: "sk_live_abc123") se existir
   */
  prefix?: string;

  /**
   * Backend schema usa "scopes"
   */
  scopes: string[];

  expiresAt?: string | null;
  lastUsedAt?: string | null;

  /**
   * status “boolean” (conforme type anterior)
   */
  isActive: boolean;

  createdBy?: string | null;
  createdAt: string;
}

export interface ApiKeyUsage {
  keyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Payload alinhado ao validation.ts
 */
export interface CreateApiKeyPayload {
  name: string;
  scopes: string[];
  expiresAt?: string;
}

/**
 * Resposta de criação:
 * muitos backends retornam o segredo "key" apenas UMA vez.
 * Seu service atual retorna { apiKey, key } — mantemos isso.
 */
export interface CreateApiKeyResponse {
  apiKey: ApiKey;
  key: string; // segredo exibido uma vez
}
