var request      = require('request'),
    async        = require('async'),
    redis        = require('redis'),
    allowedFuncs = ['get', 'post', 'put', 'patch'];

var rqs = setupValues();

function setupValues() {
    return function() {
        if(!this.calledOnce) {
            this.calledOnce = true;

            async.filter(Object.keys(request), function (key, cb) {
                cb(request[key] instanceof Function);
            }, function(results){
                async.each(results, function(key, callback) {
                    var $this   = this;
                    rqs[key] = function () {
                        var fn      = request[key],
                            args    = Array.prototype.slice.call(arguments);

                        if (this.client) {
                            return setupFunctionWithCache($this, fn, args);
                        } else {
                            return fn.apply($this, args);
                        }
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

        if ($this.client) {
            return setupFunctionWithCache($this, fn, args);
        } else {
            return fn.apply($this, args);
        }
    };
}

function setupFunctionWithCache(thisInstance, origFunc, args) {

    var callback = args.pop();

    args.push(function (err, res, body) {
        callback(err, res, body);
    });

    origFunc.apply(thisInstance, args);
}

rqs.setupRedisCache = function(client, options) {
    this.options = !options ? {} : options;
    this.client = client;

    this.calledOnce = false;
    rqs = setupValues();
};

module.exports = rqs;