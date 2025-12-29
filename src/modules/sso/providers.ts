// src/modules/sso/providers.ts
import axios from 'axios';
import { env } from '../../core/config/env';

export interface OAuthProvider {
  name: string;
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<{ accessToken: string }>;
  getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    avatar?: string;
  }>;
}

class GoogleProvider implements OAuthProvider {
  name = 'google';

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string }> {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    return { accessToken: response.data.access_token };
  }

  async getUserInfo(accessToken: string) {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: response.data.id,
      email: response.data.email,
      name: response.data.name,
      avatar: response.data.picture,
    };
  }
}

class MicrosoftProvider implements OAuthProvider {
  name = 'microsoft';

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.MICROSOFT_CLIENT_ID,
      redirect_uri: env.MICROSOFT_REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      response_mode: 'query',
    });
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string }> {
    const params = new URLSearchParams({
      code,
      client_id: env.MICROSOFT_CLIENT_ID,
      client_secret: env.MICROSOFT_CLIENT_SECRET,
      redirect_uri: env.MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const response = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      params
    );

    return { accessToken: response.data.access_token };
  }

  async getUserInfo(accessToken: string) {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      id: response.data.id,
      email: response.data.mail || response.data.userPrincipalName,
      name: response.data.displayName,
      avatar: undefined,
    };
  }
}

class GitHubProvider implements OAuthProvider {
  name = 'github';

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_REDIRECT_URI,
      scope: 'user:email',
      state,
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string }> {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        code,
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        redirect_uri: env.GITHUB_REDIRECT_URI,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    return { accessToken: response.data.access_token };
  }

  async getUserInfo(accessToken: string) {
    const [userResponse, emailsResponse] = await Promise.all([
      axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    const primaryEmail = emailsResponse.data.find((e: any) => e.primary)?.email;

    return {
      id: userResponse.data.id.toString(),
      email: primaryEmail || userResponse.data.email,
      name: userResponse.data.name || userResponse.data.login,
      avatar: userResponse.data.avatar_url,
    };
  }
}

export const providers: Record<string, OAuthProvider> = {
  google: new GoogleProvider(),
  microsoft: new MicrosoftProvider(),
  github: new GitHubProvider(),
};
