var request = require('../main.js');

request('http://httpbin.org/get', function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body); // Print the google web page.
  }
});
request.post({ url: 'http://httpbin.org/post',
               followAllRedirects: true,
               form: { foo: 'bar' } }, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body); // Print the google web page.
  }
});

console.log("Example Started");