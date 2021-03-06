import axios, { AxiosInstance } from 'axios';
import {
  TokenInformation,
  TokenRefresherFunc,
  TokenRefresherOptions,
  TokenType,
  AuthToken
} from './types';

const defaultOptions: TokenRefresherOptions = {
  invalidTokenStatuses: [401],
  tokenHeaderName: 'authorization',
  buildTokenHeader: function (token: TokenInformation) {
    return `${token.type} ${token.value}`
  }
}

export default function wrapTokenRefresher(
  axiosClient: AxiosInstance,
  refreshToken: TokenRefresherFunc,
  customOptions?: Partial<TokenRefresherOptions>
): AxiosInstance {
  const options = {
    ...defaultOptions,
    ...customOptions
  };

  const token = new Token(refreshToken);
  const getAuthorizationHeader = (token: TokenInformation) => options.buildTokenHeader(token);
  const isInvalidTokenStatus = (errorStatus: number, invalidTokenStatuses: number[]) => invalidTokenStatuses.indexOf(errorStatus) >= 0

  axiosClient.interceptors.request.use(async (config) => {
    const authToken = await token.get();
    config.headers.common[options.tokenHeaderName] = getAuthorizationHeader(authToken);
    return config;
  });

  axiosClient.interceptors.response.use((response) => response, async (error) => {
    const { response: { status } } = error;
    if (isInvalidTokenStatus(status, options.invalidTokenStatuses)) {
      const authToken = await token.get(true);
      const { config: originalRequest } = error;

      originalRequest.headers.Authorization = getAuthorizationHeader(authToken);
      return axios(originalRequest);
    }

    throw error;
  });

  return axiosClient;
}

class Token {
  private _value?: string = undefined;
  private _type?: TokenType = undefined;
  private _expiresAt?: Date = undefined;
  private _inprogressRequest?: Promise<AuthToken> = undefined;

  constructor(private refreshAuthToken: TokenRefresherFunc) {
  }

  private _set(rawToken: AuthToken) {
    const expirySafeDelay = 2000;

    this._value = rawToken.accessToken;
    this._expiresAt = new Date(new Date().getTime() + (rawToken.expiresIn * 1000 - expirySafeDelay));
    this._type = rawToken.tokenType;
  }

  private _isValid() {
    return this._value &&
      this._expiresAt &&
      this._expiresAt >= new Date();
  }

  private async _refresh() {
    let tokenResponse;
    try {
      this._inprogressRequest = this._inprogressRequest || this.refreshAuthToken();
      tokenResponse = await this._inprogressRequest;
    } catch (error) {
      throw error;
    } finally {
      this._inprogressRequest = undefined;
    }

    this._set(tokenResponse);
  }

  async get(forceRefresh: boolean = false): Promise<TokenInformation> {
    if (forceRefresh || !this._isValid()) {
      await this._refresh();
    }

    return { value: this._value!, type: this._type! };
  }
}