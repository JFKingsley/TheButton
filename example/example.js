var ButtonAPI = require('../main.js');
var api = new ButtonAPI();

api.getNewToken(function(tokenData) {

    api.connect(tokenData.token, tokenData.epoch);

    api.on('tick', function(data) {
      console.log('tick');
      console.log(data);
    })

    api.on('buttonReset', function(data) {
      console.log('reset');
      console.log(data);
    })
});

console.log("Example Started");