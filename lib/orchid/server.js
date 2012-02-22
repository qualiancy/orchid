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

  this.clients = [];

  this._server = http.createServer();
  this._wss = new WebSocketServer({ server: this._server });
  this._wss.on('connection', this._connectHandler.bind(this));
}

util.inherits(Server, Drip);

Server.prototype.listen = function (port, cb) {
  var self = this;

  cb = cb || function () {};

  function listening () {
    self.emit('listening');
    cb();
  }

  this._server.listen(port, listening);
};

Server.prototype.close = function (cb) {
  var self = this;
  cb = cb || function () {};
  this._server.once('close', function () {
    self.emit('close');
    cb();
  });
  this._wss.close();
  this._server.close();
};

Server.prototype._connectHandler = function (ws) {
  var self = this;

  ws.on('message', function (m) {
    for (var i = 0; i < self.clients.length; i++) {
      var client = self.clients[i];
      client.send(m);
    }
  });

  ws.on('close', function () {
    var i = self.clients.indexOf(ws);
    delete self.clients[i];
  });

  this.clients.push(ws);
  this.emit('connection', ws);
};
