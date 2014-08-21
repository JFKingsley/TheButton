var request      = require('request'),
    async        = require('async'),
    allowedFuncs = ['get', 'post', 'put', 'patch'];

var rqs = function () {
    if(!global.calledOnce) {
        global.calledOnce = true;
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
                // if any of the file processing produced an error, err would equal that error
                if( err ) {
                  // One of the iterations produced an error.
                  // All processing will now stop.
                  console.log('A file failed to process');
                } else {
                  console.log('All files have been processed successfully');
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