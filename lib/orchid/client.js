var util = require('util')
  , Drip = require('drip')
  , WebSocket = require('ws');

module.exports = Client;

function Client (address, opts) {
  Drip.call(this, { delimeter: '::' });

  this._queue = [];
  this._ws = new WebSocket(address);
  this._ws.on('open', this.connectHandler.bind(this));
  this._ws.on('message', this.messageHandler.bind(this));
}

util.inherits(Client, Drip);

Client.prototype._emit = function () {
  Drip.prototype.emit.apply(this, arguments);
};

Client.prototype.emit = function () {
  if (this._ws.readyState != 1) {
    this._queue.push(arguments);
    return;
  }

  var event = arguments[0]
    , args = Array.prototype.slice.call(arguments, 1);

  this._ws.send(this.frame('event', { event: event, args: args }));
};

Client.prototype.connectHandler = function () {
  var self = this;
  this._emit('open');
  this._queue.forEach(function (args) {
    self.emit.apply(self, args);
  });
};

Client.prototype.frame = function (cmd, data) {
  return JSON.stringify({
      command: cmd
    , data: data
  });
};

Client.prototype.messageHandler = function (data, flags) {
  var inc = JSON.parse(data);
  switch (inc.command) {
    case 'event':
      var event = Array.isArray(inc.data.event) ? inc.data.event : inc.data.event.split(this._drip.delimiter)
        , args = [event].concat(inc.data.args || {});
      this._emit.apply(this, args);
      break;
  };
};

Client.prototype.close = function () {
  this._ws.close()
};
