export type TokenType = 'Basic' | 'Bearer';

export type AuthToken = {
  accessToken: string, tokenType: TokenType, expiresIn: number
};

export type TokenRefresherFunc = () => Promise<AuthToken>;

export interface TokenRefresherOptions {
  invalidTokenStatuses: number[],
  tokenHeaderName: string,
  buildTokenHeader: (token: TokenInformation) => string
};

export type TokenInformation = {
  value: string;
  type: TokenType;
};