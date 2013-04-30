#mariastream

> Simplified stream interface for mariaDB, build upon the [mariasql](https://github.com/mscdex/node-mariasql) module.

## Installation

```sheel
npm install mariastream
```

## Example

```javascript
// Other modules
var typepoint  = require('typepoint');
var inspectpoint = require('inspectpoint');

// This module
var mariastream = require('mariastream');

// Create client and connect
var client = mariastream();
    client.connnect({
      host: '127.0.0.1',
      user: 'root',
      password: ''
    });

// There are connection and close events, but you don't have to wait for that

client
  // Create a statement object, this is like prepare query that you can use
  // multiply times. Except it also works for normal querys without paramenters.
  .statement('SELECT id, act FROM database.table WHERE name = :name')

  // Create a readable object stream, there are also writable stream, duplex stream,
  // and a simple execute method there will buffer the result.
  .readable({name: 'andreas'})

  // This module don't do typecasting, but there are modules for that purpose.
  // NOTE: if you know of a fast way to do automatic typecasting please let me know
  .pipe(typepoint({id: Number, act: String}))

  // Each `data` event or `.read()` call gives an object,
  // run util.inspect and output it.
  .pipe(inspectpoint())
  .pipe(process.stdout);

  // Outputs:
  // {id: 1, act: 'sleeping'}
  // {id: 2, act: 'eating'}
  // {id: 3, act: 'programming'}
  // PS: Yeah, I can't eat and do programming at once, I'm a disgrace.
```

## TODO

* Complete tests for abort once mariasql has been fixed
* Complete tests for connected property once mariasql has been fixed
* Write external stream module for type conversion

## Documentation

This module is a wrapper around the [mariasql](https://github.com/mscdex/node-mariasql) module. Therefore if you are in doubt, you should consult thier documentation
for more information.


The `mariastream` module returns an object constructor that you should use to
create or wrap a connection.

```javascript
var mariastream = require('mariastream');
```

### Class: Client

#### Client = mariastream([options])

To create a client simple call the `mariastream` client constructor.

```javascript
var client = mariastream();
```

The constructor takes an optional `options` object, the idea is that these options
are inherited by each new `Statement` object. At the moment only the option `useArray`
exists. For more information about this option visit the [mariasql](https://github.com/mscdex/node-mariasql) documentation.

```javascript
var client = mariastream({useArray: true}); // Default is false
```

#### Client.connect(settings, [callback])
#### Client.connect(mariasql, [callback])

When `client` object is created it is not connected anything before the `.connect`
method is executed. The connect methods requires a first argument, there can either
be an object there takes the same options as `[mariasql](https://github.com/mscdex/node-mariasql).connect()` method, or it can be a `mariasql` instance.
In case of the latter, you must call or have called the `.connect()` on the `mariasql`
instance.

The second argument is an optional callback and will execute once the client is
connected. In case you connected using an already connected `mariasql` instance
the callback won't be called.

```javascript
client.connect({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  multiStatements: true,
  db: 'my-database'
}, function () {
  console.log('connected');
});
```

#### Client.close([callback])

Closes the connection. Note that all querys must be completed before
the connection will be closed. The optional `callback` argument is called
when connection is actually closed.

```javascript
client.close(function () {
  console.log('connection is closed');
});
```

### Client.connected

Returns true if the client is connected.

### Client.threadId

If the client is connected, this is the thread id for the connection on the server.

#### Event: Client.on('error')

Errors can happen (e.q. connection error), unless its form a statement the error
will emit on this object.

#### Event: Client.on('connect')

Emitted when a connection is made.

#### Event: Client.on('close')

Emitted when the connection is closed.

### Class: Statement

#### Statement = Client.statement(sql, [options])

When you want to query something from a database, you have to create a `statement`
object. If the SQL query is the same, you can reused this object. This is especially
useful in case the query contains placeholders. The the internal prepare function
won't have to be created multiply times. Once `statement` object has been made, you
can then call one of its methods in order to execute the SQL query.

The `.statement` method, requires an SQL query, there can contain multiply commands.
The query can also contain placeholders, the syntax of those are defined by the [mariasql](https://github.com/mscdex/node-mariasql) module. But put in a simple way
if you use `?` signs, then use arrays. If you use `:placeholder` then use objects.

```javascript
var query = client.statement(
  'UPDATE mariastream.test SET value=:after WHERE value=:before;' +
  'SELECT value FROM mariastream.test WHERE value=:after'
);
```

The second argument is an optional object, there take the same properties as
the `client` constructor. If a property is not defined here, it inherits from
the options set in `client` constructor.

#### Abortable = Statement.execute([params], callback);

Unlike the other `statement` methods, this method don't return an object stream
interface. Instread it simply executes the statement and buffer up the resutlt.
Once the statement has been processed or an error occurred the callback will be
called.

```javascript
query.execute(function (err, rows, info) {
  console.log('statement execution is done');
});
```

The `callback` takes 3 arguments, the first is an `Error` or `null`, the second
and array of the rows, the thrid is an info object there contain the following
properties:

```javascipt
{
  insertId: Number
  affectedRows: Number,
  numRows: Number
}
```

It should be noted that unlike the [mariasql](https://github.com/mscdex/node-mariasql)
module, the info object will contain the summed information for all subquerys
in the statement.

The `.execute` method also takes an optional `params` object before the `callback`.
This object contain parameters for the prepare statement to use.

#### ReadStream = Statement.readable([params])

The `.readable` method, returns an object ReadStream, where each fetched row
can be accessed from the `data` event or the `.read()` method.

The method takes an optional `params` object, there sets the parameters in the
prepare statement to use.

```javascript
query.readable(['value'])
  .pipe(inspectpoint())
  .pipe(process.stdout);
```

#### DublexStream = Statement.duplex()

The `.duplex` method, returns an object DuplexStream. This means that each
`.write(params)` will result in the `statement` to be processed with the required
`params` objects specifing the parameters for the prepare statement to use. The
rows from each statement can then be read though the `data` event or a `.read()`
call.

Its important to note that since 10 writes will be processed simultaneously, there
are no garantie for the order of the returned rows. If the order is important
it is therefore recomended to return a static value (e.q. `id`) even if it is known in advance and only return one row (e.q. `LIMIT 1`).

```javascript
var updater = client.statement(
  'SELECT id, value FROM mariastream.test WHERE id=:id LIMIT 1;' +
  'UPDATE mariastream.test SET value=:value WHERE id=:id'
).writable();

updater.write({id: 2, value: 'bar'});
updater.once('readable', function () {
  updater.read(); // {id: '2', value: 'foo'}
});
```

#### WriteStream = Statement.writable()

This works very much like the `.duplex` stream. The important diffrence is that
this is a WriteStream only, meaning that it won't buffer up rows if you don't
need them. Also you can't accidently pipe from this stream only too.

It should be noted that if the `statement` this WriteStream will execute do
return rows, you are mostlikely doing it wrong. But now you have all the stream
types you could want.

### Class: Abortable

This object is returned by the `statement.execute` method. It is the same object that the `[mariasql](https://github.com/mscdex/node-mariasql).query` method will return. 

#### Abortable.abort()

The only reason to use this object, is if you would abort the statement execution.

### Class: Stream

There are 3 methods there return a stream object, they are called
`statement.readable`, `statement.duplex` and `statement.writable`. Some of them
can be read from others can be written to.

They all have the classic (stream)[http://nodejs.org/api/stream.html] methods,
but futhermore they also share these methods:

#### Stream.destroy()

This will abort all active statements in progress related to the stream. In case
of the `statement.readable` this is only one active query. But in the case of
`stream.wirtable` and `steam.duplex` there can up to 10 active queries.

#### Event: Stream.on('close')

When the stream is done, either becase no more data can be read or written, or
if the stream has been aborted this event will emit.

#### Event: Stream.on('error')

If an error happen while processing the query, this event will emit.

#### Event: Stream.on('info')

This event will emit once a single query has been processed. In the
`statement.readable` it will only emit once, but in the `statement.writable`
and `statement.writable` case it can emit any number of times.

The event emits with an object set as first argument with the following properties:

```javascipt
{
  insertId: Number
  affectedRows: Number,
  numRows: Number
}
```

## License

**The software is license under "MIT"**

> Copyright (c) 2013 Andreas Madsen
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in
> all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
> THE SOFTWARE.
