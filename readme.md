RequestCache
=====

![RequestCache NPM](https://nodei.co/npm/requestcache.png)

> RequestCache is a drop-in replacement for the request module, which has the added ability to easily cache http responses to Redis.
### Install
```bash
$ npm install requestcache
```

### Usage
```javascript
var request = require('requestcache');

request('http://httpbin.org/get', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log("Standard request: " + body); // Print the google web page.
  }
});

var redisConfig = {
    host: "",
    port: 6968,
    password: ""
};

request.setupRedisCache(redisConfig, {redisPrefix: "prefixOne"});

request.get({cacheResponse: true, url: 'http://httpbin.org/get',
               form: { foo: 'bar' } }, function (error, res, body) {
  if (!error && res.statusCode == 200) {
    console.log("Caching body on this request: " + body); // Print the google web page.
  }
});

request.get({cacheResponse: true, url: 'http://httpbin.org/get',
               form: { foo: 'bar' } }, function (error, res, body) {
  if (!error && res.statusCode == 200) {
    console.log("Cached body: " + body); // Print the google web page.
  }
});
```

It's that simple, you just drop it in, pass one config option though and bingo!

### Config

The setupRedisCache function takes two parameters, the client and the options. Currently for the client you can pass through an object containing the details and it'll create one for you, or you can pass through a [node_redis](https://github.com/mranney/node_redis) client and it'll use that. 

Currently the options only accept the redisPrefix option which adds a prefix to all redis entries.