var request      = require('request'),
    async        = require('async'),
    allowedFuncs = ['get', 'post', 'put', 'patch'];

var rqs = function () {
    if(!this.calledOnce) {
        this.calledOnce = true;
        async.filter(Object.keys(request), function (key, cb) {
            cb(request[key] instanceof Function);
        }, function(results){
            async.each(results, function(key, callback) {
                rqs[key] = function () {
                    var $this   = this,
                        fn      = request[key],
                        args    = Array.prototype.slice.call(arguments);

                    setupFunctionWithCache($this, fn, args);
                };
                return callback(null);
            }, function(err){
                if (err) {
                    throw new Error(err);
                }
            });
        });
    }

    var $this   = this,
        fn      = request,
        args    = Array.prototype.slice.call(arguments);

        return setupFunctionWithCache($this, fn, args);
};

function setupFunctionWithCache(thisInstance, origFunc, args) {
    if (this.client) {

    } else {
        return origFunc.apply(thisInstance, args);
    }
}

rqs.setupRedisCache = function(client, options) {
    this.options = !options ? {} : options;
    this.client = client;
};

module.exports = rqs;