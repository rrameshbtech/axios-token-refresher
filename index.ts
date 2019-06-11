import axios, { AxiosInstance } from 'axios';

import { TokenRefresherOptions } from "./types";

export default function wrapWithTokenRefresher(axiosClient: AxiosInstance, options: TokenRefresherOptions): AxiosInstance {

  let tokenRefresher = new AuthTokenRefresher(options);

  axiosClient.interceptors.request.use(async (config) => {
    const authToken = await tokenRefresher.getValidToken();
    config.headers.common['authorization'] = `${authToken.type} ${authToken.value}`;
    return config;
  });

  return axiosClient;
}

class AuthTokenRefresher {
  private _token: Token;
  private _options: TokenRefresherOptions;

  constructor(options: TokenRefresherOptions) {
    this._options = options;
  }

  private async _refreshToken() {
    const tokenResponse = await axios.post(this._options.tokenUrl, this._options.body, {
      headers: this._options.headers
    });

    this._token = new Token(tokenResponse.data);
  }

  private _isTokenValid() {
    return this._token && this._token.value && this._token.expiresAt >= new Date();
  }

  async getValidToken(): Promise<Token> {
    if (!this._isTokenValid()) {
      await this._refreshToken();
    }
    return this._token;
  }
}

class Token {
  constructor(rawToken: { access_token: string, token_type: 'Basic' | 'Bearer', expires_in: number, scope: string }) {
    const expirySafeDelay = 2000;

    this.value = rawToken.access_token;
    this.expiresAt = new Date(new Date().getTime() + (rawToken.expires_in * 1000 - expirySafeDelay));
    this.type = rawToken.token_type;
    this.scope = rawToken.scope;
  }

  value: string
  type: 'Basic' | 'Bearer'
  expiresAt: Date
  scope: string
}