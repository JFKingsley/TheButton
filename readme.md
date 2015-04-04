The Button API
=====

![TheButton NPM](https://nodei.co/npm/thebutton.png)

> The Button API is a simple, easy to use library for quickly gathering data from Reddit's The Button.
### Install
```bash
$ npm install thebutton
```

### Usage
```javascript
var TheButton = require('thebutton');

var api = new ButtonAPI('6903b1e79b5e5162fb792775eb187bc343824cd7', '1428256960');

api.connect();

api.on('tick', function(data) {
  console.log('tick');
})

api.on('buttonReset', function(data) {
  console.log('reset');
})
```

It's that simple, you just drop it in, pass one config option though and bingo!

### Config

The initial creation function can take two parameters, a token and an epoch. This is to allow people to potentially enact clicking behaviour with user tokens, but as of the moment this appears to be impossible to work with the token reload mechanism

###Problem?

Just file an issue or a PR to fix it and i'll take a look ASAP.