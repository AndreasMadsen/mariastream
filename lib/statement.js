
var streams = require('./stream.js');
var abstact = require('./abstact.js');

function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

function Statement(connection, sql, options) {
  this._connection = connection;
  this._prepare = connection._client.prepare(sql);
  this._options = options;
}
module.exports = Statement;

Statement.prototype.execute = function (params, callback) {
  if (callback === undefined) {
    callback = params;
    params = undefined;
  }

  // Validate argument
  if (params !== undefined && !isObject(params)) {
    throw new TypeError('params must be an object or an array');
  }
  if (typeof callback !== 'function') {
    throw new TypeError('callback must be a function');
  }

  // Execute sql query and buffer up the results
  var rows = [];
  var error = null;
  var info = null;
  var result = abstact(this, params, {
    onrow: function (row) {
      rows.push(row);
    },
    onend: function (meta) {
      info = meta;
    },
    onerror: function (err) {
      error = err;
    },
    onclose: function () {
      callback(error, rows, info);
    }
  });

  return result;
};

Statement.prototype.readable = function (params) {
  // Validate argument
  if (params !== undefined && !isObject(params)) {
    throw new TypeError('params must be an object or an array');
  }

  // Create a dublex stream and finish it imediatly with one write
  return new streams.Readable(this, params);
};

Statement.prototype.writable = function () {
  return new streams.Writable(this);
};

Statement.prototype.duplex = function () {
  return new streams.Duplex(this);
};
