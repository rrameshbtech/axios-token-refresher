export interface TokenRefresherOptions {
  tokenUrl: string
  body?: any
  headers: Headers
  clientId: string
  clientSecret: string
}

interface Headers {
  [key: string]: string
}