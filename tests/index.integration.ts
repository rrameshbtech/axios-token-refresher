import { expect } from 'chai';
import wrapTokenRefresher, { AuthToken } from '../index';
import axios, { AxiosInstance } from 'axios';

describe('index', () => {
  let oauthClient: AxiosInstance = null;
  before(() => {
    async function mockRefreshToken(): Promise<AuthToken> {
      return {
        accessToken: process.env.AUTH_SERVER_TOKEN,
        tokenType: "Bearer",
        expiresIn: 3600
      }
    }
    const axiosClient = axios.create();
    oauthClient = wrapTokenRefresher(axiosClient, mockRefreshToken);
  });

  it('should get response by appending auth token', async () => {
    const actualResponse = await oauthClient.get('https://api.thoughtworks.net/capable/v2/offerings/digital-platforms');
    expect(actualResponse.data.identifier).to.equal('digital-platforms');
  });

  it('should wait for the previous auth token request if already inprogress', async () => {
    const request1 = oauthClient.get('https://api.thoughtworks.net/capable/v2/offerings/digital-platforms');
    const request2 = oauthClient.get('https://api.thoughtworks.net/capable/v2/offerings/product-evolution');
    const actualResponses = await Promise.all([request1, request2]);
    expect(actualResponses[0].data.identifier).to.equal('digital-platforms');
    expect(actualResponses[1].data.identifier).to.equal('product-evolution');
  });
});