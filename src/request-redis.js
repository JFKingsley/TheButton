var request = require('request'),
    allowedFuncs = ['get', 'post', 'put', 'patch'];

var rqs = function () {
    var $this   = this,
        fn      = request,
        args    = Array.prototype.slice.call(arguments);

        return setupFunctionWithCache($this, fn, args);
};

Object.keys(request).filter(function (key) {
    return request[key] instanceof Function;
}).forEach(function (key) {
    var fn = request[key];
    rqs[key] = function () {
        console.log(key);
        //TODO figure out why this only fires once per function call
        var $this   = this,
            args    = Array.prototype.slice.call(arguments);

        setupFunctionWithCache($this, fn, args);
    };

});

function setupFunctionWithCache(thisInstance, origFunc, args) {
    if (this.client) {

    } else {
        return request.apply(thisInstance, args);
    }
}

rqs.setupRedisCache = function(client, options) {
    this.options = !options ? {} : options;
    this.client = client;
};

module.exports = rqs;