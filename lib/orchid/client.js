var util = require('util')
  , Drip = require('drip')
  , WebSocket = require('ws');

function makeid() {
  var text = ""
    , possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i=0; i < 10; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

module.exports = Client;

function Client (address, opts) {
  Drip.call(this, { delimeter: '::' });

  this.rpc = {};
  this._queue = [];
  this._ws = new WebSocket(address);
  this._ws.on('open', connectHandler.bind(this));
  this._ws.on('close', disconnectHandler.bind(this));
  this._ws.on('message', messageHandler.bind(this));
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
    , args = Array.prototype.slice.call(arguments, 1)
    , len = args.length;

  if ('function' === typeof args[len - 1]) {
    var cb = args.splice(len - 1, 1)
      , id = makeid();
    this.rpc[id] = cb[0];
    this._ws.send(this.frame('request', { event: event, id: id, args: args }));
  } else {
    this._ws.send(this.frame('event', { event: event, args: args }));
  }
};

Client.prototype.close = function () {
  this._ws.close()
};

Client.prototype.frame = function (cmd, data) {
  return JSON.stringify({
      command: cmd
    , data: data
  });
};

function connectHandler () {
  var self = this;
  this._emit('open');
  this._queue.forEach(function (args) {
    self.emit.apply(self, args);
  });
};

function messageHandler (data, flags) {
  var self = this
    , inc = JSON.parse(data);
  switch (inc.command) {
    case 'event':
      var event = Array.isArray(inc.data.event) ? inc.data.event : inc.data.event.split(this._drip.delimiter)
        , args = [event].concat(inc.data.args || {});
      this._emit.apply(this, args);
      break;
    case 'request':
      var event = Array.isArray(inc.data.event) ? inc.data.event : inc.data.event.split(this._drip.delimiter)
        , id = inc.data.id
        , args = [event].concat(inc.data.args || {});
      args.push(function () {
        var res = Array.prototype.slice.call(arguments, 0)
          , response = self.frame('response', { id: id, args: res });
        self._ws.send(response);
      });
      this._emit.apply(this, args);
      break;
    case 'response':
      var id = inc.data.id
        , res = inc.data.args
        , cb = this.rpc[id];
      if (cb) {
        cb.apply(this, res);
      }
      break;
  };
};

function disconnectHandler () {
  this._emit('close');
};

