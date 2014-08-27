var request      = require('request'),
    async        = require('async'),
    redis        = require('redis'),
    crypto       = require('crypto'),
    Base64       = {encode:function(e){var b=new Buffer(e);return b.toString('base64');},decode:function(e){var b =new Buffer(e, 'base64'); return b.toString();}},
    allowedFuncs = ['get', 'post', 'put', 'patch'];

var rqs = setupValues();

function setupValues() {
    return function() {
        if (!this.calledOnce) {
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
                            $this.client  = this.client;
                            $this.options = this.options;
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
    if (args[0].cacheResponse && thisInstance.client) {
        var callback    = args.pop(),
            argsHash = args[0];

        delete argsHash.cacheResponse;
        delete argsHash.cacheExpiry;

        argsHash = JSON.stringify(argsHash);
        argsHash = crypto.createHash('sha1').update(argsHash).digest('hex');

        var redisKey = [argsHash];

        if (thisInstance.options.prefix && thisInstance.options.prefix instanceof String) {
            key.unshift(thisInstance.options.prefix);
        }
console.log(redisKey);
        thisInstance.client.get(redisKey, function(err, reply) {
            if (reply) {

            } else {
                args.push(function (err, res, body) {
                    //Set all the header keys to lowercase, just to be sure
                    var key, keys = Object.keys(res.headers),
                        n         = keys.length;
                    while (n--) {
                      key = keys[n];
                      res.headers[key.toLowerCase()] = res.headers[key];
                    }

                    //Checks if there are any caching params set and obeys them
                    var canCache = true,
                        expire   = args.cacheExpiry || 3600;

                    if (!res.headers['cache-control'] || res.headers['cache-control'].split(',').indexOf('no-cache') > -1 || !res.headers.pragma || res.headers.pragma.toLowerCase() === 'no-cache' || res.headers['cache-control'].split(',').indexOf('private') > -1) {
                        canCache = false;
                    }

                    if (!res.headers['cache-control'] || res.headers['cache-control'].split(',').indexOf('must-revalidate') > -1 || args.cacheResponse) {
                        canCache = true;
                    }

                    if (canCache) {
                        //Save body to cache
                        console.log(body + redisKey);
                        callback(err, res, body);
                    } else {
                        //Return the response with no caching
                        return callback(err, res, body);
                    }
                });

                //Fire function call
                origFunc.apply(thisInstance, args);
            }
        });
    } else {
        origFunc.apply(thisInstance, args);
    }
}

rqs.setupRedisCache = function(client, options) {
    this.options = !options ? {} : options;

    if (client instanceof redis.RedisClient) {
        this.client = client;
    } else if (client instanceof Object){
        this.client = redis.createClient(client);
        if (client.password) {
            this.client.auth(client.password);
        }
    }

    if(this.client) {
        this.calledOnce = false;
        rqs = setupValues();
    }
};

module.exports = rqs;