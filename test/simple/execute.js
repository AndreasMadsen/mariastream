
var mariastream = require('../../lib/mariastream.js');
var test = require('tap').test;
var setup = require('../setup.js');

var client = mariastream();

test('connect and create test database', function (t) {
  client.connect(setup.connectObject(), function () {
    setup.createDatabase(client, function () {
      t.end();
    });
  });
});

test('simple execute with no parameters using array', function (t) {
  client.statement('SELECT 1 + 1 AS solution', { useArray: true })
    .execute(function (err, rows, info) {
      t.equal(err, null);
      t.deepEqual(rows, [[ '2' ]]);
      t.deepEqual(info, {
        insertId: 0,
        affectedRows: 0,
        numRows: 1
      });
      t.end();
    });
});

test('simple execute with no parameters using object', function (t) {
  client.statement('SELECT 1 + 1 AS solution')
    .execute(function (err, rows, info) {
      t.equal(err, null);
      t.deepEqual(rows, [{solution: '2'}]);
      t.deepEqual(info, {
        insertId: 0,
        affectedRows: 0,
        numRows: 1
      });
      t.end();
    });
});

test('simple execute error', function (t) {
  client.statement('SHOW TABLES')
    .execute(function (err, rows, info) {
      t.equal(err.message, 'No database selected');
      t.deepEqual(rows, []);
      t.equal(info, null);
      t.end();
    });
});

test('create temporary table', function (t) {
  setup.createTable(client, function (err) {
      t.equal(err, null);
      t.end();
    });
});

test('execute with array parameters', function (t) {
  client.statement('INSERT INTO mariastream.test (value) VALUES(?)')
    .execute(['test-array'], function (err, rows, info) {
      t.equal(err, null);
      t.deepEqual(rows, []);
      t.deepEqual(info, {
        insertId: 1,
        affectedRows: 1,
        numRows: 0
      });

      client.statement('SELECT * FROM mariastream.test WHERE id = ?')
        .execute([info.insertId], function (err, rows, info) {
          t.equal(err, null);
          t.deepEqual(rows, [{id: '1', value: 'test-array'}]);
          t.deepEqual(info, {
            insertId: 1,
            affectedRows: 0,
            numRows: 1
          });
          t.end();
        });
    });
});

test('execute with object parameters', function (t) {
  client.statement('INSERT INTO mariastream.test (value) VALUES(:value)')
    .execute({value: 'test-object'}, function (err, rows, info) {
      t.equal(err, null);
      t.deepEqual(rows, []);
      t.deepEqual(info, {
        insertId: 2,
        affectedRows: 1,
        numRows: 0
      });

      client.statement('SELECT * FROM mariastream.test WHERE id = :id')
        .execute({id: info.insertId}, function (err, rows, info) {
          t.equal(err, null);
          t.deepEqual(rows, [{id: '2', value: 'test-object'}]);
          t.deepEqual(info, {
            insertId: 2,
            affectedRows: 0,
            numRows: 1
          });
          t.end();
        });
    });
});

test('multiply execute on same statement', function (t) {
  var done = 0;

  var query = client.statement('INSERT INTO mariastream.test (value) VALUES(?)');
  query.execute(['test-multiply'], function (err) {
    t.equal(err, null);
    if (++done === 2) next();
  });
  query.execute(['test-multiply'], function (err) {
    t.equal(err, null);
    if (++done === 2) next();
  });

  function next() {
    client.statement('SELECT value FROM mariastream.test WHERE value = ?')
      .execute(['test-multiply'], function (err, rows) {
        t.equal(err, null);
        t.deepEqual(rows, [
          {value: 'test-multiply'},
          {value: 'test-multiply'}
        ]);
        t.end();
      });
  }
});

test('close client', function (t) {
  client.close(function () {
    t.end();
  });
});
