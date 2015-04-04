var util         = require('util'),
    EventEmitter = require('events').EventEmitter,
    WebSocket    = require('ws'),
    request      = require('request'),
    cheerio      = require('cheerio'),
    url          = require('url');

var ButtonAPI = function (token, epoch) {
    this.token = token;
    this.epoch = epoch;
};

util.inherits(ButtonAPI, EventEmitter);

ButtonAPI.prototype.connect = function(token, epoch) {
    if (!token && !epoch && !this.token && !this.epoch) {
        throw new Error('A valid auth token and epoch must be provided');
    }

    if(token && epoch) {
        this.token = token;
        this.epoch = epoch;
    }

    var ws = new WebSocket('wss://wss.redditmedia.com/thebutton?h=' + this.token + '&e=' + this.epoch),
        self = this,
        lastSecond = 60.0;

    ws.on('open', function() {
        this.emit('connected');
    });
    ws.on('message', function(message) {
        message = JSON.parse(message);
        var status = 'unknown';
        if(message.payload.seconds_left < lastSecond) {
            status = 'tick';
        } else {
            status = 'buttonReset';
        }
        self.emit(status, {
            time_left: message.payload.seconds_left,
            timestamp: message.payload.now_str,
            participants: parseInt(message.payload.participants_text.replace(',', '')),
            secondsLeft: (status === 'buttonReset' ? 60 - lastSecond : null)
        });
        lastSecond = message.payload.seconds_left;
    });
}

ButtonAPI.prototype.getNewToken = function(callback) {
    request('https://reddit.com/r/thebutton', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var $ = cheerio.load(body);
        var websocketURL = JSON.parse($('script[id=config]').text().substring(8).slice(0, - 1)).thebutton_websocket;
        var queryData = url.parse(websocketURL, true).query;

        return callback({token: queryData.h, epoch: queryData.e});
      } else {
        callback(false);
      }
    })
}

ButtonAPI.prototype.refreshToken = function() {
    this.getNewToken(function(err, data) {
        if(err) return console.error("Could not refresh token due to error.");
        this.token = data.token;
        this.epoch = data.epoch;
    });
}

module.exports = ButtonAPI;