
var mariastream = require('../../lib/mariastream.js');
var test = require('tap').test;
var setup = require('../setup.js');
var async = require('async');
var startpoint = require('startpoint');
var endpoint = require('endpoint');

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
  var data = DATA.map(function (letter) {
    return [letter];
  });

  setup.createTable(client, function (err) {
    t.equal(err, null);

    var query = client.statement('INSERT INTO mariastream.test (value) VALUES(?)');

    async.forEach(data, function (value, done) {
      query.execute(value, done);
    }, function () {
      t.end();
    });
  });
});

test('select values in table with a DublexStream using array', function (t) {
  var data = DATA.map(function (letter) {
    return [letter];
  });

  var getId = client.statement('SELECT value FROM mariastream.test WHERE value=?', {useArray: true})
    .duplex();

  startpoint(data, {objectMode: true})
    .pipe(getId)
    .pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.deepEqual(rows.sort(function (a, b) {
        return a[0].charCodeAt(0) - b[0].charCodeAt(0);
      }), data);
      t.end();
    }));
});


test('reset temporary table', function (t) {
  var data = DATA.map(function (letter) {
    return {value: letter};
  });

  setup.createTable(client, function (err) {
    t.equal(err, null);

    var query = client
      .statement('INSERT INTO mariastream.test (value) VALUES(:value)');

    async.forEach(data, function (value, done) {
      query.execute(value, done);
    }, function () {
      t.end();
    });
  });
});

test('select values in table with a DublexStream using object', function (t) {
  var data = DATA.map(function (letter) {
    return {value: letter};
  });

  var getId = client
    .statement('SELECT value FROM mariastream.test WHERE value=:value', {useArray: false})
    .duplex();

  startpoint(data, {objectMode: true})
    .pipe(getId)
    .pipe(endpoint({objectMode: true}, function (err, rows) {
      t.equal(err, null);
      t.deepEqual(rows.sort(function (a, b) {
        return a.value.charCodeAt(0) - b.value.charCodeAt(0);
      }), data);
      t.end();
    }));
});

test('close client', function (t) {
  client.close(function () {
    t.end();
  });
});
