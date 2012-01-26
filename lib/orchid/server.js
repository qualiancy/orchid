var Drip = require('drip')
  , WebSocket = require('ws');

module.exports = Server;

function Server(opts) {
  Drip.call(this, {
      wildcard: true
    , delimeter: '::'
  });
}

Server.prototype.__proto__ = Drip.prototype;


