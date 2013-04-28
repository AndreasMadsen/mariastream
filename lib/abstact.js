
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
  var query = null;

  // Something failed
  function onabort() {
    cleanup();

    callbacks.onclose(true);
  }
  function onerror(err) {
    cleanup();

    callbacks.onerror(err);
    callbacks.onclose(true);
  }

  // All success
  function onsuccess() {
    cleanup();

    callbacks.onclose(false);
  }

  // result handler
  function onresult(queryEmitter) {
    query = queryEmitter;

    if (callbacks.onrow) queryEmitter.on('row', callbacks.onrow);
    if (callbacks.onend) queryEmitter.once('end', callbacks.onend);
    queryEmitter.once('error', onerror);
  }

  // cleanup event handlers and internal references
  function cleanup() {
    if (query) {
      if (callbacks.onrow) query.removeListener('row', callbacks.onrow);
      if (callbacks.onend) query.removeListener('end', callbacks.onend);
      query = null;
    }

    if (result) {
      result.removeListener('abort', onabort);
      result.removeListener('error', onerror);
      result.removeListener('end', onsuccess);
      result = null;
    }
  }

  // bind result handlers
  if (callbacks.onrow || callbacks.onend) result.once('result', onresult);
  result.once('abort', onabort);
  result.once('error', onerror);
  result.once('end', onsuccess);

  // Return result object, allowing it to be aborted
  return result;
}
module.exports = abstact;
