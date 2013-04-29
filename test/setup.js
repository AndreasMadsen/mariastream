
var extend = require('util-extend');

function execute(client, sql, cb) {
  var called = false;

  var callback = function (err) {
    if (called) return;
    cb(err || null);
  };

  client.query(sql)
    .once('result', function(result) {
      result.once('error', callback);
    })
    .once('error', callback)
    .once('end', callback);
}

exports.createDatabase = function (connection, callback) {
  execute(connection._client, 'DROP DATABASE IF EXISTS mariastream', function (err) {
    if (err) return callback(err);

    execute(connection._client, 'CREATE DATABASE mariastream', callback);
  });
};

exports.createTable = function (connection, callback) {
  execute(connection._client, 'DROP TABLE IF EXISTS mariastream.test', function (err) {
    if (err) return callback(err);

    execute(connection._client,
      'CREATE TEMPORARY TABLE IF NOT EXISTS mariastream.test (' +
        'id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,' +
        'value VARCHAR(255) NOT NULL' +
      ') ENGINE = InnoDB CHARSET=utf8', callback);
  });
};

exports.connectObject = function (settings) {
  return extend({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    multiStatements: true
  }, settings);
};
