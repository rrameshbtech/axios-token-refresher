import axios, { AxiosRequestConfig, AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";
import { expect } from 'chai';
import sinon from "sinon";

import wrapTokenRefresher from "../index";

describe('index', () => {
  const returnIfAuthMatches = (
    config: AxiosRequestConfig,
    header: string,
    expected: any) => {
    return config.headers['authorization'] === header ?
      [200, expected] :
      [404]
  };

  let mockTokenRefresher: sinon.SinonSpy<any[], any>,
    mockAxios: MockAdapter,
    axiosClient: AxiosInstance;

  before(() => {
    mockTokenRefresher = sinon.fake.resolves(
      {
        accessToken: 'test-token',
        expiresIn: 3600,
        tokenType: "Bearer"
      }
    );
    axiosClient = wrapTokenRefresher(axios.create(), mockTokenRefresher);
    mockAxios = new MockAdapter(axiosClient);
  });

  beforeEach(() => {
    sinon.restore();
  });

  it('should call api with refreshed auth token', async () => {
    const expected = 'Yay! Test passed';
    mockAxios
      .onGet('https://www.test.com/scenarios')
      .reply((config) =>
        returnIfAuthMatches(config, 'Bearer test-token', expected)
      );

    const actualResponse = await axiosClient.get('https://www.test.com/scenarios');

    expect(mockTokenRefresher.calledOnce).to.be.true;
    expect(actualResponse.data).to.equal(expected);
  });

  it('should not refresh auth token if existing token is valid', async () => {
    const expected = 'Yay! Test passed';
    mockAxios
      .onGet('https://www.test.com/scenarios')
      .reply((config) =>
        returnIfAuthMatches(config, 'Bearer test-token', expected)
      );

    const firstResponse = await axiosClient.get('https://www.test.com/scenarios');
    const secondResponse = await axiosClient.get('https://www.test.com/scenarios');

    expect(mockTokenRefresher.calledOnce).to.be.true;
    expect(firstResponse.data).to.equal(expected);
    expect(secondResponse.data).to.equal(expected);
  });

});