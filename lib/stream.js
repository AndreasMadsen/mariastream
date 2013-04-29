
var util = require('util');
var stream = require('stream');

var abstact = require('./abstact.js');

// Do 10 simultaneous write requests (TODO: benchmark this)
var MAX_PROGRESS = 10;

function isObject(obj) {
  return typeof obj === 'object' && obj !== null;
}

//
// Readable stream implementation
//
function Readable(statement, params) {
  stream.Readable.call(this, {
    objectMode: true
  });

  var self = this;

  // Execute statement
  this._result = abstact(statement, params, {
    onrow: function (row) {
      self.push(row);
    },
    oninfo: function (info) {
      self.emit('info', info);
    },
    onerror: function (err) {
      self.emit('error', err);
    },
    onclose: function (success) {
      if (success) self.push(null);

      self.emit('close');
    }
  });
}
exports.Readable = Readable;
util.inherits(Readable, stream.Readable);

Readable.prototype._read = function () {
  /* implemented by push */
};

Readable.prototype.destory = function () {
  this._result.abort();
};

//
// Writable stream implementation
//
function Writable(statement) {
  stream.Writable.call(this, {
    objectMode: true,
    highWaterMark: 1
  });

  this._setup(statement);
}
exports.Writable = Writable;
util.inherits(Writable, stream.Writable);

Writable.prototype._setup = function (statement) {
  this._statement = statement;

  // Close flags
  this._stop = false;
  this._closeing = false;

  // Stores the current and next progress
  this._progress = new Array(0);
  this._nextWrite = null;

  this.once('finish', function () {
    this._closeing = true;
  });
};

Writable.prototype._write = function (params, encoding, done) {
  var self = this;

  if (this._stop) return;

  // Validate row
  if (!isObject(params)) {
    this.destory();
    this.emit('error', new TypeError('params must be an object or array'));
  }

  // If progress is full, then store this row and wait for something to finish
  if (this._progress.length === MAX_PROGRESS) {
    this._nextWrite = [params, encoding, done];
    return;
  }

  // Execute statement
  var result = abstact(this._statement, params, {
    onrow: !this.readable ? null : function (row) {
      self.push(row);
    },
    oninfo: function (info) {
      self.emit('info', info);
    },
    onerror: function (err) {
      self.destory();
      self.emit('error', err);
    },
    onclose: function (success) {
      // Remove result from list
      var index = self._progress.indexOf(result);
      if (index !== -1) {
        self._progress.splice(index, 1);
      }

      // No more can be written
      if (self._closeing &&
          self._progress.length === 0 &&
          self._nextWrite === null) {

        // Signal that no more data can be read
        if (self._stop === false && self.readable && success) {
          self.push(null);
        }

        // Emit close if last result object and we are closeing
        self.emit('close');
      }

      // If a write is in the queue, then call write
      if (self._nextWrite) {
        var args = self._nextWrite;
        self._nextWrite = null;
        self._write(args[0], args[1], args[2]);
      }
    }
  });
  this._progress.push(result);

  // Start next write immediately
  done(null);
};

Writable.prototype.destory = function () {
  if (this._stop) return;

  // Set stop flags
  this._stop = true;
  this._closeing = true;

  // Abort all progress obejcts
  for (var i = 0, l = this._progress.length; i < l; i++) {
    this._progress[i].abort();
  }
};

//
// Duplex stream implementation
//
function Duplex(statement) {
  stream.Duplex.call(this, {
    objectMode: true,
    highWaterMark: 1
  });

  this._setup(statement);
}
exports.Duplex = Duplex;
util.inherits(Duplex, stream.Duplex);

Duplex.prototype._setup = Writable.prototype._setup;
Duplex.prototype._write = Writable.prototype._write;
Duplex.prototype._read = Readable.prototype._read;
Duplex.prototype.destory = Writable.prototype.destory;
