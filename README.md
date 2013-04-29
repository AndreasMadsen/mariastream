#mariastream

> Simplified stream interface for mariaDB, build upon the [mariasql](https://github.com/mscdex/node-mariasql) module.

## Installation

```sheel
npm install mariastream
```

## TODO

3. Test abort methods
4. Support connect using a mariasql instance
5. Write example
6. Relay all methods and events between mariastream and mariasql
7. Write documentation
8. Write external stream module for type conversion

## Documentation

```javascript
var mariaClient = require('mariastream');
```

### Class: Client

#### Client = connection([options])

#### Client.connect(settings, callback)

#### Client.close(callback)

#### Event: Client.on('error')

#### Event: Client.on('connect')

#### Event: Client.on('close')

### Class: Statement

#### Statement = Client.Statement(sql, [options])

#### Abortable = Statement.execute([params], callback);

#### ReadStream = Statement.readable([params])

#### WriteStream = Statement.writable()

#### DublexStream = Statement.duplex()

### Class: Abortable

#### Abortable.abort()

### Class: Stream

#### Stream.destroy()

#### WriteStream.write(params)
#### DuplexStream.write(params)

#### ReadStream.read()
#### DuplexStream.read()

#### Event: Stream.on('close')

#### Event: Stream.on('error')

#### Event: Stream.on('info')

##License

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
