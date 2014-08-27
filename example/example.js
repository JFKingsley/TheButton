var request = require('../main.js');

request('http://httpbin.org/get', function (error, response, body) {
  if (!(!error && response.statusCode == 200 && body)) {
    console.log("FAILED!"); // Print the google web page.
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
    console.log(body); // Print the google web page.
  }
});

console.log("Example Started");