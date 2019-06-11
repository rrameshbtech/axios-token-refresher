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
        'authorization': `Basic ${process.env.TOKEN_KEY}`
      },
      body: 'grant_type=client_credentials&scope=api'
    };
    const axiosClient = axios.create();
    oauthClient = wrapWithTokenRefresher(axiosClient, testOptions);
  });

  it('should return Get API response with valid auth token', async () => {
    const actualResponse = await oauthClient.get('https://api.thoughtworks.net/capable/v2/offerings/digital-platforms');
    expect(actualResponse.data.identifier).to.equal('digital-platforms');
  });
});