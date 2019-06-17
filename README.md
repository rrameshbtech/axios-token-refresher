# axios-token-refresher

This library enables your axios client to append a valid authorization token to your requests.

## How to use?

This library is not deployed to npm yet. so you can add below line in your package.json.

```
scripts: {
  "axios-token-refresher": "git@github.com:rrameshbtech/axios-token-refresher.git"
}
```

Then do `npm install`.

Then add below code into your applications.

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
This functions fetches the new authorization token & returns the Promise
This function will be called by refresher to get new token whenever the existing
token is expired.
*/
const fetchAuthToken = () => axios
  .get('www.auth-server.com/get/token/')
  .then(response => formatTokenResponse(response));

const axiosClientWithToken = wrapTokenRefresher(axios.create(), fetchAuthToken);

```

Now `axiosClientWithToken` as like normal axios client which will take care of refreshing & adding new auth tokens.

## License

This library is licensed under MIT License
