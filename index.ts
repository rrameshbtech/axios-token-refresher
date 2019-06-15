import axios, { AxiosInstance } from 'axios';

export default function wrapTokenRefresher(axiosClient: AxiosInstance, refreshToken: TokenRefresherFunc): AxiosInstance {

  const token = new Token(refreshToken);

  const getAuthorizationHeader = (token: TokenInformation) => `${token.type} ${token.value}`

  axiosClient.interceptors.request.use(async (config) => {
    const authToken = await token.get();
    config.headers.common['authorization'] = getAuthorizationHeader(authToken);
    return config;
  });

  axiosClient.interceptors.response.use((response) => response, async (error) => {
    if (error.response.status === 401) {
      const authToken = await token.get();
      const { config: originalRequest } = error;

      originalRequest.headers.Authorization = getAuthorizationHeader(authToken);
      return axios(originalRequest);
    }

    throw error;
  });

  return axiosClient;
}

export type TokenType = 'Basic' | 'Bearer';
export type AuthToken = {
  accessToken: string, tokenType: TokenType, expiresIn: number
};
type TokenInformation = {
  value: string;
  type: TokenType;
};
type TokenRefresherFunc = () => Promise<AuthToken>;

class Token {
  private _value: string
  private _type: TokenType
  private _expiresAt: Date
  private _inprogressRequest: Promise<AuthToken>;

  constructor(private refreshAuthToken: TokenRefresherFunc) {
  }

  private _set(rawToken: AuthToken) {
    const expirySafeDelay = 2000;

    this._value = rawToken.accessToken;
    this._expiresAt = new Date(new Date().getTime() + (rawToken.expiresIn * 1000 - expirySafeDelay));
    this._type = rawToken.tokenType;
  }

  private _isValid() {
    return this._value && this._expiresAt >= new Date();
  }

  private async _refresh() {
    let tokenResponse;
    try {
      this._inprogressRequest = this._inprogressRequest || this.refreshAuthToken();
      tokenResponse = await this._inprogressRequest;
    } catch (error) {
      throw error;
    } finally {
      this._inprogressRequest = null;
    }

    this._set(tokenResponse);
  }

  async get(): Promise<TokenInformation> {
    if (!this._isValid()) {
      await this._refresh();
    }

    return {
      value: this._value,
      type: this._type
    }
  }
}