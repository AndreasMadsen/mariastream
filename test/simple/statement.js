
var mariastream = require('../../lib/mariastream.js');
var test = require('tap').test;
var setup = require('../setup.js');

var client = mariastream();


test('statement will by default use objects', function (t) {
  var statement = mariastream().statement('SHOW DATABASES');

  t.equal(statement._options.useArray, false);
  t.end();
});

test('statement inherits options from constructor', function (t) {
  var statement = mariastream({useArray: true}).statement('SHOW DATABASES');

  t.equal(statement._options.useArray, true);
  t.end();
});

test('statement can overwrite inherit options from constructor', function (t) {
  var statement = mariastream({useArray: true}).statement('SHOW DATABASES', {useArray: false});

  t.equal(statement._options.useArray, false);
  t.end();
});
