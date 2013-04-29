
var mariastream = require('../../lib/mariastream.js');
var test = require('tap').test;
var setup = require('../setup.js');
var startpoint = require('startpoint');

var client = mariastream();
var DATA = 'abcdefghijklmnopqrstuvxyz'.split('');

test('connect and create test database', function (t) {
  client.connect(setup.connectObject(), function () {
    setup.createDatabase(client, function () {
      t.end();
    });
  });
});

test('reset temporary table', function (t) {
  setup.createTable(client, function (err) {
      t.equal(err, null);
      t.end();
    });
});

test('WriteStream rows to table using array', function (t) {
  var dump = client
    .statement('INSERT INTO mariastream.test (value) VALUES(?)')
    .writable();

  var data = DATA.map(function (letter) {
    return [letter];
  });

  startpoint(data, {objectMode: true})
    .pipe(dump)
    .once('close', function () {
      client.statement('SELECT value FROM mariastream.test', {useArray: true})
        .execute(function (err, rows) {
          t.equal(err, null);
          t.deepEqual(rows, data);
          t.end();
        });
    });
});

test('reset temporary table', function (t) {
  setup.createTable(client, function (err) {
      t.equal(err, null);
      t.end();
    });
});

test('WriteStream rows to table using objects', function (t) {
  var dump = client
    .statement('INSERT INTO mariastream.test (value) VALUES(:value)')
    .writable();

  var data = DATA.map(function (letter) {
    return {value: letter};
  });

  startpoint(data, {objectMode: true})
    .pipe(dump)
    .once('close', function () {
      client.statement('SELECT value FROM mariastream.test')
        .execute(function (err, rows) {
          t.equal(err, null);
          t.deepEqual(rows, data);
          t.end();
        });
    });
});

test('reset temporary table', function (t) {
  setup.createTable(client, function (err) {
      t.equal(err, null);
      t.end();
    });
});

test('multiply querys in same writable stream', function (t) {
  var dump = client
    .statement(
      'INSERT INTO mariastream.test (value) VALUES(?);' +
      'INSERT INTO mariastream.test (value) VALUES(?)'
    )
    .writable();

  var data = DATA.map(function (letter) {
    return [letter, letter.toUpperCase()];
  });

  var info = [];
  var expectedInfo = [];

  for (var i = 1; i <= 50; i++) {
    expectedInfo.push({ insertId: i, affectedRows: 1, numRows: 0 });
  }

  startpoint(data, {objectMode: true})
    .pipe(dump)
    .on('info', function (meta) { info.push(meta); })
    .once('close', function () {
      client.statement('SELECT value FROM mariastream.test', {useArray: true})
        .execute(function (err, rows) {
          t.equal(err, null);
          t.deepEqual(
            Array.prototype.concat.apply([], rows).sort(),
            Array.prototype.concat.apply([], data).sort()
          );
          t.deepEqual(info, expectedInfo);
          t.end();
        });
    });
});

test('WriteStream emitting error', function (t) {
  var dump = client
    .statement('SHOW TABLES')
    .writable();

  dump.write([]);
  dump.end();
  dump.once('error', function (err) {
    t.equal(err.message, 'No database selected');
    t.end();
  });
});

test('close client', function (t) {
  client.close(function () {
    t.end();
  });
});
