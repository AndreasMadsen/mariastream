
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
  var client1 = mariastream({ useArray: false });
  t.equal(client1._options.useArray, false);
  t.end();
});

test('constructor default options', function (t) {
  var client2 = mariastream({});
  t.equal(client2._options.useArray, true);

  var client3 = mariastream();
  t.equal(client3._options.useArray, true);

  t.end();
});

test('connect and close with events', function (t) {
  var client = mariastream();

  client.connect(setup.connectObject());
  console.log('connect call');

  client.once('connect', function () {
    console.log('connect emit');

    client.close();
    client.once('close', function () {
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
