import axios, { AxiosInstance } from 'axios';


export type TokenType = 'Basic' | 'Bearer';
export type AuthToken = {
  accessToken: string, tokenType: TokenType, expiresIn: number
};
export type TokenRefresherFunc = () => Promise<AuthToken>;
export interface TokenRefresherOptions  {
  invalidTokenStatuses: number[]
};
type TokenInformation = {
  value: string;
  type: TokenType;
};

export default function wrapTokenRefresher(
  axiosClient: AxiosInstance, 
  refreshToken: TokenRefresherFunc, 
  options: TokenRefresherOptions = {invalidTokenStatuses: [401]}
): AxiosInstance {
  const token = new Token(refreshToken);
  const getAuthorizationHeader = (token: TokenInformation) => `${token.type} ${token.value}`
  const isInvalidTokenStatus = (errorStatus:number, invalidTokenStatuses:number[]) => invalidTokenStatuses.indexOf(errorStatus) >= 0

  axiosClient.interceptors.request.use(async (config) => {
    const authToken = await token.get();
    config.headers.common['authorization'] = getAuthorizationHeader(authToken);
    return config;
  });

  axiosClient.interceptors.response.use((response) => response, async (error) => {
    const { response : {status}} = error;
    if(isInvalidTokenStatus(status, options.invalidTokenStatuses)) {
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

    // @ts-ignore: undefined value assignable error
    return { value: this._value, type: this._type };  
  }
}