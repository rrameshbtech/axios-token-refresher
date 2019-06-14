import axios, { AxiosInstance } from 'axios';

import { TokenRefresherOptions } from "./types";

export default function wrapWithTokenRefresher(axiosClient: AxiosInstance, options: TokenRefresherOptions): AxiosInstance {

  let token = new Token(options);

  axiosClient.interceptors.request.use(async (config) => {
    const authToken = await token.get();
    config.headers.common['authorization'] = `${authToken.type} ${authToken.value}`;
    return config;
  });

  axiosClient.interceptors.response.use((response) => {
    if (response.status === 401) {

    }
    return response;
  });

  return axiosClient;
}

type TokenType = 'Basic' | 'Bearer';
type RawToken = {
  access_token: string, token_type: TokenType, expires_in: number, scope: string
};
type TokenInformation = {
  value: string;
  type: TokenType;
};

class Token {
  private _value: string
  private _type: TokenType
  private _expiresAt: Date
  private _inprogressRequest: Promise<any>;

  constructor(private _options: TokenRefresherOptions) {
  }

  private _set(rawToken: RawToken) {
    const expirySafeDelay = 2000;

    this._value = rawToken.access_token;
    this._expiresAt = new Date(new Date().getTime() + (rawToken.expires_in * 1000 - expirySafeDelay));
    this._type = rawToken.token_type;
  }

  private _isValid() {
    return this._value && this._expiresAt >= new Date();
  }

  private async _refresh() {
    let tokenResponse;
    try {
      if (!this._inprogressRequest) {
        this._inprogressRequest = axios.post(this._options.tokenUrl, this._options.body, {
          headers: this._options.headers
        });
      }
      tokenResponse = await this._inprogressRequest;
    } catch (error) {
      throw error;
    } finally {
      this._inprogressRequest = null;
    }

    this._set(tokenResponse.data);
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