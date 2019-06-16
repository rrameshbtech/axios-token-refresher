import axios, { AxiosRequestConfig } from "axios";
import MockAdapter from "axios-mock-adapter";
import { expect } from 'chai';
import sinon from "sinon";

import wrapTokenRefresher from "../index";

describe('Axios Token Refresher', () => {
  const returnIfAuthMatches = (
    config: AxiosRequestConfig,
    header: string,
    expected: any) => {
    return config.headers['authorization'] === header ?
      [200, expected] :
      [404]
  };

  let mockTokenRefresher = sinon.fake.resolves(
    {
      accessToken: 'test-token',
      expiresIn: 3600,
      tokenType: "Bearer"
    }
  );

  let mockTokenRefresherWith1SecondExpiry = sinon.fake.resolves(
    {
      accessToken: 'test-token',
      expiresIn: 1,
      tokenType: "Bearer"
    }
  );

  beforeEach(() => {
    sinon.resetHistory();
  });

  it('should call api with refreshed auth token', async () => {
    const axiosClient = wrapTokenRefresher(axios.create(), mockTokenRefresher);
    const mockAxios = new MockAdapter(axiosClient);

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
    const axiosClient = wrapTokenRefresher(axios.create(), mockTokenRefresher);
    const mockAxios = new MockAdapter(axiosClient);

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

  it('should refresh token when api returned 401', async () => {
    const axiosClient = wrapTokenRefresher(axios.create(), mockTokenRefresher);
    const mockAxios = new MockAdapter(axiosClient);
    const mockGenricAxios = new MockAdapter(axios);

    const expected = 'Yay! Test passed';
    mockAxios
      .onGet('https://www.test.com/scenarios')
      .replyOnce(401);
    mockGenricAxios
      .onGet('https://www.test.com/scenarios')
      .replyOnce((config) =>
        returnIfAuthMatches(config, 'Bearer test-token', expected)
      );

    const response = await axiosClient.get('https://www.test.com/scenarios');

    expect(mockTokenRefresher.calledTwice).to.be.true;
    expect(response.data).to.equal(expected);
  });

  it('should refresh token when existing token is expired', async () => {
    const axiosClient = wrapTokenRefresher(axios.create(), mockTokenRefresherWith1SecondExpiry);
    const mockAxios = new MockAdapter(axiosClient);

    const expected = 'Yay! Test passed';
    mockAxios
      .onGet('https://www.test.com/scenarios')
      .reply((config) =>
        returnIfAuthMatches(config, 'Bearer test-token', expected)
      );

    const firstResponse = await axiosClient.get('https://www.test.com/scenarios');
    expect(mockTokenRefresherWith1SecondExpiry.calledOnce).to.be.true;
    expect(firstResponse.data).to.equal(expected);

    const secondResponse = await axiosClient.get('https://www.test.com/scenarios');
    expect(mockTokenRefresherWith1SecondExpiry.calledTwice).to.be.true;
    expect(secondResponse.data).to.equal(expected);
  });

});