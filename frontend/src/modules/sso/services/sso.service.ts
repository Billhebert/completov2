/**
 * Single Sign‑On (SSO) Service
 *
 * The initial scaffold described a vision for a fully featured SSO
 * administration console supporting OAuth2/OIDC, SAML and LDAP
 * providers with health checks, usage stats and domain routing.  The
 * backend currently implements a subset of that functionality via a
 * simple OAuth implementation (`backend/src/modules/sso/index.ts`).
 * This service builds upon those endpoints to expose provider
 * management and user connection helpers.  It also exposes the
 * authorization flow for initiating login via third‑party identity
 * providers and listing/disconnecting linked accounts.
 */

import api, { extractData } from '../../../core/utils/api';
import type { SSOProvider, SSOConnection } from '../types';

/**
 * List configured SSO providers.  Returns a list of providers with
 * their masked configuration details.  The backend may extend this
 * endpoint in the future to include health and usage statistics.
 */
export async function getProviders(): Promise<SSOProvider[]> {
  const response = await api.get('/sso/providers');
  return extractData(response);
}

/**
 * Create or update an SSO provider configuration.  The payload
 * should include all required fields for the given provider type
 * (OAuth2/OIDC, SAML or LDAP).  The backend performs validation and
 * may return warnings if connectivity tests fail.  Only
 * administrators should call this API.
 */
export async function createProvider(data: Partial<SSOProvider>): Promise<SSOProvider> {
  const response = await api.post('/sso/providers', data);
  return extractData(response);
}

/**
 * Initiate the SSO login flow for a given provider.  The backend
 * generates a state parameter for CSRF protection and returns the
 * authorization URL.  The caller should redirect the user's
 * browser to the returned `redirectUrl`.  For OIDC providers this
 * will include `client_id`, `redirect_uri`, `scopes`, `state` and
 * `nonce` parameters; for SAML providers it will include a Base64
 * encoded AuthnRequest.  For LDAP providers, the user must be
 * prompted for credentials instead of redirecting.
 */
export async function initiateSSOLogin(providerId: string): Promise<{ redirectUrl: string }> {
  const response = await api.post(`/sso/providers/${providerId}/initiate`);
  return extractData(response);
}

/**
 * Begin the OAuth authorization flow for a named provider (e.g.,
 * `google`, `microsoft`).  This is a convenience wrapper around
 * `/sso/:provider/authorize` which returns a URL to redirect the user
 * to.  It generates a state internally and stores it in the server.
 */
export async function authorizeProvider(provider: string): Promise<{ url: string }> {
  const response = await api.get(`/sso/${provider}/authorize`);
  return extractData(response);
}

/**
 * Complete the OAuth authorization flow.  The frontend should call
 * this after the identity provider redirects back with a `code` and
 * `state` query parameter.  The backend validates the state,
 * exchanges the code for an access token, retrieves user info and
 * returns JWT tokens for the local application.  On success, the
 * response includes the logged in user and a pair of access/refresh
 * tokens.
 */
export async function oauthCallback(provider: string, code: string, state: string): Promise<{
  user: { id: string; email: string; name: string; role: string; companyId: string };
  accessToken: string;
  refreshToken: string;
}> {
  const response = await api.get(`/sso/${provider}/callback`, { params: { code, state } });
  return extractData(response);
}

/**
 * List OAuth accounts linked to the current user.  Requires the user
 * to be authenticated.  The response includes the provider name,
 * provider user ID and timestamps for when the account was created
 * and last used.  This is useful for displaying which identities are
 * connected and enabling account linking management.
 */
export async function listAccounts(): Promise<Array<{ provider: string; providerUserId: string; lastUsedAt: string; createdAt: string }>> {
  const response = await api.get('/sso/accounts');
  return extractData(response);
}

/**
 * Disconnect a linked OAuth account.  Removes all stored tokens for
 * the given provider.  The user must have at least one remaining
 * login method or else the backend will return an error.  After
 * disconnection, the provider will no longer be available for
 * authentication until it is linked again.
 */
export async function disconnectAccount(provider: string): Promise<void> {
  await api.delete(`/sso/accounts/${provider}`);
}

/**
 * List federated identity connections for a specific user.  Admins
 * may specify any user ID; non‑admins will only see their own
 * connections.  The returned objects include metadata such as the
 * external ID, linked email, last login time and login count.
 */
export async function getUserConnections(userId: string): Promise<SSOConnection[]> {
  const response = await api.get(`/sso/users/${userId}/connections`);
  return extractData(response);
}