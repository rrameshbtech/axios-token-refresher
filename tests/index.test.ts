import { expect } from 'chai';
import wrapWithTokenRefresher from '../index';
import axios, { AxiosInstance } from 'axios';

import { TokenRefresherOptions } from "../types";

describe('index', () => {
  let oauthClient: AxiosInstance = null;
  before(() => {
    const testOptions: TokenRefresherOptions = {
      tokenUrl: 'https://thoughtworks.okta.com/oauth2/aus1fjygi70z7ZtVB0h8/v1/token',
      clientId: '',
      clientSecret: '',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'authorization': `Basic ${process.env.AUTH_SERVER_TOKEN}`
      },
      body: 'grant_type=client_credentials&scope=api'
    };
    const axiosClient = axios.create();
    oauthClient = wrapWithTokenRefresher(axiosClient, testOptions);
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