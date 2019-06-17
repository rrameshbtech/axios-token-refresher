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
      expiresIn: response.exipry_duration,
      tokenType: response.token_type
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

## License

This library is licensed under MIT License
