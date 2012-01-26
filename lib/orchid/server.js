var util = require('util')
  , http = require('http')
  , Drip = require('drip')
  , WebSocketServer = require('ws').Server;

module.exports = Server;

function Server(opts) {
  Drip.call(this, {
      wildcard: true
    , delimeter: '::'
  });

  this._server = http.createServer(opts);
  this._wss = new WebSocketServer({ server: this._server });
  this._wss.on('connection', this._connectHandler.bind(this));
}

util.inherits(Server, Drip);

Server.prototype.listen = function (port, host, cb) {
  var self = this;
  if ('function' === typeof host) {
    cb = host
    host = null;
  };

  function listening () {
    self.emit('listening');
    if (cb) cb();
  }

  if (host) {
    this._server.listen(port, host, listening);
  } else {
    this._server.listen(port, listening);
  }
};

Server.prototype.close = function (cb) {
  var self = this;
  this._server.once('close', function () {
    self.emit('close');
    if (cb) cb();
  });
  this._server.close();
};

Server.prototype._connectHandler = function (ws) {
  this.emit('connection');
};
