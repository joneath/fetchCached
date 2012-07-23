(function() {
  var delegateFetch = Backbone.Collection.prototype.fetch;

  Backbone.Collection.prototype.fetch = function(options) {
    var savedObj,
        cache,
        key,
        TTL,
        savedTTL,
        now,
        old;

    options || (options = {});

    if (options.cache) {
      options.success || (options.success = function(){});
      cache = options.cache.cache || "session";
      cache = window[cache + "Storage"];
      key = options.cache.key || this.__proto__.url;
      TTL = options.cache.TTL;

      if (cache[key]) {
        savedObj = JSON.parse(cache[key]);

        if (savedObj.TTL) {
          now = new Date();
          savedTTL = new Date(savedObj.TTL);

          if (now <= savedTTL) {
            return cachedSuccess(this, savedObj.data, options);
          } else {
            cache.removeItem(key);
          }
        } else {
          return cachedSuccess(this, savedObj.data, options);
        }
      }
      options.success = wrapSuccess(options.success, cache, key, TTL);
    }

    return delegateFetch.call(this, options);
  };

  function wrapSuccess(delegateSuccess, cache, key, TTL) {
    var current = new Date();

    TTL || (TTL = 0);
    TTL = parseInt(current.getTime(), 10) + (TTL * 1000);

    return function(collection, data) {
      cache[key] = JSON.stringify({
        TTL: TTL,
        data: data
      });

      if (delegateSuccess) {
        delegateSuccess.apply(this, arguments);
      }
    };
  }

  function cachedSuccess(collection, data, options) {
    collection.reset(collection.__proto__.parse(data));
    options.success.call(collection, collection, data);

    return;
  }
}( ));
