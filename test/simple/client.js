
var Mariasql = require('mariasql');
var mariastream = require('../../lib/mariastream.js');
var test = require('tap').test;
var setup = require('../setup.js');

test('constructor validate options', function (t) {
  try {
    mariastream('wrong');
  } catch (e) {
    t.equal(e.name, 'TypeError');
    t.equal(e.message, 'options must be an object');
  }
  t.end();
});

test('constructor overwrite default options', function (t) {
  var client1 = mariastream({ useArray: true });
  t.equal(client1._options.useArray, true);
  t.end();
});

test('constructor default options', function (t) {
  var client2 = mariastream({});
  t.equal(client2._options.useArray, false);

  var client3 = mariastream();
  t.equal(client3._options.useArray, false);

  t.end();
});

test('connect and close with events', function (t) {
  var client = mariastream();

  client.connect(setup.connectObject());
  client.once('connect', function () {
    t.equal(client.connected, true);
    t.equal(typeof client.threadId, 'string');

    client.close();
    client.once('close', function () {
      t.equal(client.connected, false);
      t.end();
    });
  });
});

test('connect and close with callbacks', function (t) {
  var client = mariastream();

  client.connect(setup.connectObject(), function () {
    client.close(function () {
      t.end();
    });
  });
});

test('error while connecting', function (t) {
  var client = mariastream();

  client.connect(setup.connectObject({
    host: '##'
  }));

  client.once('error', function (err) {
    t.equal(err.message, 'getaddrinfo ENOTFOUND');
    t.end();
  });
});

test('can\'t connect while connected', function (t) {
  var client = mariastream();

  client.connect(setup.connectObject(), function () {
    try {
      client.connect(setup.connectObject());
    } catch (e) {
      t.equal(e.name, 'Error');
      t.equal(e.message, 'connection is already made');

      client.close(function () {
        t.end();
      });
    }
  });
});

test('connect using mariasql object', function (t) {
  var simple = new Mariasql();
  var client = mariastream();

  simple.connect(setup.connectObject());

  client.connect(simple, function () {
    t.equal(client.connected, true);

    client.close(function () {
      t.equal(client.connected, false);
      t.end();
    });
  });
});
