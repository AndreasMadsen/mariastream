
var MariaClient = require('mariasql');
var events = require('events');
var util = require('util');

var Statement = require('./statement.js');

// isObject helper
function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

// Creates the main MariaConnection object
function MariaConnection(options) {
  if (!(this instanceof MariaConnection)) return new MariaConnection(options);

  events.EventEmitter.call(this);

  // Default options here
  this._options = {
    useArray: false
  };
  // Set and validate user defined options
  this._options = this._handleOptions(options);

  // Create client object
  this._setClient(new MariaClient());
}
util.inherits(MariaConnection, events.EventEmitter);
module.exports = MariaConnection;

// Relay connected property
Object.defineProperty(MariaConnection.prototype, 'connected', {
  enumerable: true,
  get: function () {
    return this._client.connected;
  }
});

// Relay threadId property
Object.defineProperty(MariaConnection.prototype, 'threadId', {
  enumerable: true,
  get: function () {
    return this._client.threadId;
  }
});

// Connect client
MariaConnection.prototype.connect = function (settings, callback) {
  // Validate arguments
  if (!isObject(settings)) {
    throw new TypeError('settings object must be specified');
  }

  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  // Can't connect if connection is already made
  if (this.connected) {
    throw new Error('connection is already made');
  }

  // Overwirte currect client
  if (settings instanceof MariaClient) {
    this._setClient(settings);
  }
  // Connect current client
  else {
    this._client.connect(settings);
  }

  if (callback) this._client.once('connect', callback);
};

// Close client
MariaConnection.prototype.close = function (callback) {
  // Validate arguments
  if (callback !== undefined && typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  // Close client
  this._client.end();
  if (callback) this._client.once('close', callback);
};

// Setup client
MariaConnection.prototype._setClient = function (client) {
  this._client = client;

  // Relay events
  this._client.once('connect', this.emit.bind(this, 'connect'));
  this._client.once('close', this.emit.bind(this, 'close'));
  this._client.on('error', this.emit.bind(this, 'error'));
};

// Validate and parse objects
MariaConnection.prototype._handleOptions = function (options) {
  if (options === undefined) {
    return {
      useArray: this._options.useArray
    };
  } else if (isObject(options)) {
    return {
      useArray: options.hasOwnProperty('useArray') ? !!options.useArray : this._options.useArray
    };
  } else {
    throw new TypeError('options must be an object');
  }
};

// Create a Statement object there links the different interfaces to the sql
// query.
MariaConnection.prototype.statement = function (query, options) {
  options = this._handleOptions(options);

  return new Statement(this, query, options);
};
