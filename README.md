# axios-token-refresher

This library enables your axios client to append a valid authorization token to your requests.

## How to use?

Install the package using NPM as given below.

```
npm i axios-token-refresher
```

Then add the below code into your application.

```
const wrapTokenRefresher = require('axios-token-refresher');

const formatTokenResponse = (response) => ({
  {
      accessToken: response.token,
      expiresIn: response.exipry_duration, //in seconds
      tokenType: response.token_type // "Bearer" | "Basic"
    }
});

/*
This function fetches the new authorization token & returns the Promise
This function will be called by refresher to get new token whenever the existing
token is expired.
*/
const fetchAuthToken = () => axios
  .get('www.auth-server.com/get/token/')
  .then(response => formatTokenResponse(response));

const axiosClientWithToken = wrapTokenRefresher(axios.create(), fetchAuthToken);

```

Now use `axiosClientWithToken` as like normal axios client which will take care of refreshing & attaching valid auth token with your requests.

Note: authorization token is attached to the requests in below format.

`authorization: '${tokenType} ${authToken}'`

## Optoins

Options can be passed as the third parameter for `wrapTokenRefresher`. It is optional.

```
const options = {
  invalidTokenStatuses : [401, 403] //List of HTTP statuses which are sent by server when token is invalid. default value - [401]
};

const axiosClientWithToken = wrapTokenRefresher(axios.create(), fetchAuthToken, options);

```

## License

This library is licensed under MIT License
