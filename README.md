# FetchCached
FetchCached is a dead simple drop in modification to `collection.fetch()` which adds support for localStorage and sessionStorage data caching.

## Usage
FetchCached overwrites `Backbone.Collection.prototype.fetch` so it's immediately available in all `collection.fetch()` method calls.

		myCollection.fetch({
			cache: {
				cache: "local",
				key: "myCollection", 
				TTL: 60 * 10 // 10 minutes
			},
			success: function(collection, data) { … }
		});
If the `collection.fetch` method is not given a `cache` option, then it delegates to the original Collection.fetch method. This means all your current `collection.fetch()` will not be impacted :)
		
#### options

* `cache` - "session" or "local" (defaults to session).
* key - The cache key to store the collection under (defaults to the `collection.url`).
* TTL - # of seconds that the cached version is valid for (defaults to forever).