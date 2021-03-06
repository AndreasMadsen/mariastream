
var mariastream = require('../../lib/mariastream.js');
var test = require('tap').test;
var setup = require('../setup.js');
var endpoint = require('endpoint');
var async = require('async');

var client = mariastream();

test('connect and create test database', function (t) {
  client.connect(setup.connectObject(), function () {
    setup.createDatabase(client, function () {
      t.end();
    });
  });
});

test('simple single row ReadStream using array', function (t) {
  var reader = client.statement('SELECT 1 + 1 AS solution', {useArray: true})
    .readable();

  reader.pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.deepEqual(rows, [['2']]);
      t.deepEqual(reader.info, {
        queries: 1,
        insertId: 0,
        affectedRows: 0,
        numRows: 1
      });
      t.end();
    }));
});

test('simple single row ReadStream using object', function (t) {
  var info = null;
  var reader = client.statement('SELECT 1 + 1 AS solution')
    .readable();

  reader.pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.deepEqual(rows, [{solution: '2'}]);
      t.deepEqual(reader.info, {
        queries: 1,
        insertId: 0,
        affectedRows: 0,
        numRows: 1
      });
      t.end();
    }));
});

test('simple ReadStream emitting error', function (t) {
  client.statement('SHOW TABLES')
    .readable()
    .pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err.message, 'No database selected');
      t.deepEqual(rows, []);
      t.end();
    }));
});

test('multiply querys in same reaable stream', function (t) {
  var reader = client.statement('SELECT 1 + 1 AS solution;SELECT 2 + 2 AS solution;')
    .readable();

  reader.pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.deepEqual(rows, [
        {solution: '2'},
        {solution: '4'}
      ]);
      t.deepEqual(reader.info, {
        queries: 2,
        insertId: 0,
        affectedRows: 0,
        numRows: 2
      });
      t.end();
    }));
});

test('setup temporary table', function (t) {
  setup.createTable(client, function (err) {
    t.equal(err, null);

    var query = client.statement('INSERT INTO mariastream.test (value) VALUES(?)');

    async.forEach(['a', 'b', 'c', 'd', 'e'], function (value, done) {
      query.execute([value], done);
    }, function () {
      t.end();
    });
  });
});

test('ReadStream on multiply rows', function (t) {

  var reader = client.statement('SELECT * FROM mariastream.test')
    .readable();

  reader.pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.deepEqual(rows, [
        {id: '1', value: 'a'},
        {id: '2', value: 'b'},
        {id: '3', value: 'c'},
        {id: '4', value: 'd'},
        {id: '5', value: 'e'}
      ]);
      t.deepEqual(reader.info, {
        queries: 1,
        insertId: 5,
        affectedRows: 0,
        numRows: 5
      });
      t.end();
    }));
});

test('ReadStream with parameters as array', function (t) {

  client.statement('SELECT * FROM mariastream.test WHERE id = ?')
    .readable([1])
    .pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.deepEqual(rows, [
        {id: '1', value: 'a'}
      ]);
      t.end();
    }));
});

test('ReadStream with parameters as object', function (t) {

  client.statement('SELECT * FROM mariastream.test WHERE id = :id')
    .readable({id: 1})
    .pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.deepEqual(rows, [
        {id: '1', value: 'a'}
      ]);
      t.end();
    }));
});

test('close client', function (t) {
  client.close(function () {
    t.end();
  });
});
