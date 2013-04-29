
//
// Low level single query abstaction
// callbacks are: onrow(row), onend(info), onerror(err), onclose(success)
//
function abstact(statement, params, callbacks) {
  // Stores the result emitter and the query emitter
  var result = statement._connection._client.query(
    statement._prepare(params),
    statement._options.useArray
  );
  var querys = [];

  // Something failed
  function onabort() {
    cleanup();

    callbacks.onclose(false);
  }
  function onerror(err) {
    cleanup();

    callbacks.onerror(err);
    callbacks.onclose(false);
  }

  // All success
  function onsuccess() {
    cleanup();

    callbacks.onclose(true);
  }

  // result handler
  function onresult(queryEmitter) {
    querys.push(queryEmitter);

    if (callbacks.onrow) queryEmitter.on('row', callbacks.onrow);
    if (callbacks.oninfo) queryEmitter.once('end', callbacks.oninfo);
    queryEmitter.once('error', onerror);
  }

  // cleanup event handlers and internal references
  function cleanup() {
    for (var i = 0, l = querys.length; i < l; i++) {
      if (callbacks.onrow) querys[i].removeListener('row', callbacks.onrow);
      if (callbacks.oninfo) querys[i].removeListener('end', callbacks.oninfo);
      querys[i].removeListener('error', onerror);
    }
    querys = [];

    if (result) {
      result.removeListener('abort', onabort);
      result.removeListener('error', onerror);
      result.removeListener('end', onsuccess);
      result = null;
    }
  }

  // bind result handlers
  result.on('result', onresult);
  result.once('abort', onabort);
  result.once('error', onerror);
  result.once('end', onsuccess);

  // Return result object, allowing it to be aborted
  return result;
}
module.exports = abstact;
