var request      = require('request'),
    async        = require('async'),
    redis        = require('redis'),
    url          = require('url'),
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
            argsHash    = Object.create(args[0]);

        delete argsHash.cacheResponse;
        delete argsHash.cacheExpiry;
        //Create the redis key
        argsHash = JSON.stringify(argsHash);
        argsHash = crypto.createHash('sha1').update(argsHash).digest('hex');

        var redisKey = [url.parse(args[0].url).host, argsHash];
        if (thisInstance.options.redisPrefix && typeof thisInstance.options.redisPrefix === 'string') {
            redisKey.unshift(thisInstance.options.redisPrefix);
        }

        redisKey = redisKey.join(':');

        //Check if the body is currently cached
        thisInstance.client.get(redisKey, function(err, reply) {
            if (err) {
                return callback("[RequestCache] Failed to connect to redis cache.", null, null);
            }

            if (reply) {
                //Unpack and return the cached response
                var cachedResponse = JSON.parse(Base64.decode(
                    reply
                ));
                cachedResponse.res.cachedResponse = true;
                callback(cachedResponse.err, cachedResponse.res, cachedResponse.res.body);
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
                        expire   = args[0].cacheExpiry || 3600;

                    if ((res.headers['cache-control'] && res.headers['cache-control'].split(',').indexOf('no-cache') > -1) || (res.headers['cache-control'] && res.headers['cache-control'].split(',').indexOf('private') > -1) || (res.headers.pragma && res.headers.pragma.toLowerCase() === 'no-cache')) {
                        canCache = false;
                    }

                    if (!res.headers['cache-control'] || res.headers['cache-control'].split(',').indexOf('must-revalidate') > -1 || args.cacheResponse) {
                        canCache = true;
                    }

                    if(args[0].cacheResponse) {
                        canCache = true;
                    }

                    if (res.headers['cache-control']) {
                        var maxAgeResult = res.headers['cache-control'].split(',').filter(function(item){
                            return typeof item == 'string' && item.indexOf('max-age') > -1;
                        });

                        var expireResult = res.headers['cache-control'].split(',').filter(function(item){
                            return typeof item == 'string' && item.indexOf('expires') > -1;
                        });

                        if (maxAgeResult !== [] && expire === 3600) {
                            expire = parseInt(maxAgeResult.toString().replace(' ', '').split('=')[1]);
                        }

                        if (expireResult !== [] && expire === 3600) {
                            expire = parseInt(expireResult.toString().replace(' ', '').split('=')[1]);
                        }
                    }

                    if (canCache) {
                        //Save body to cache
                        res.cachedResponse = true;
                        var fixedRes = res.toJSON();
                        delete fixedRes.request.body;

                        var resObj = Base64.encode(require('json-stringify-safe')({
                            err: err,
                            res: fixedRes
                        }));
                        //Save the data to redis with the appropriate expiry
                        client.setex(redisKey, expire, resObj, function(err) {
                            if(err) {
                                callback("[RequestCache] " + err, null, null);
                            }

                            callback(err, res, body);
                        });
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