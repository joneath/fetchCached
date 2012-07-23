describe(".fetch", function() {
  var clock,
      collection,
      Collection = Backbone.Collection.extend({
        url: "testing"
      });

  beforeEach(function() {
    clock = sinon.useFakeTimers();

    jasmine.Ajax.useMock();

    window.localStorage.clear();
    window.sessionStorage.clear();

    collection = new Collection();
  });

  afterEach(function() {
    clock.restore();
  });

  describe("when the cache key is set in the fetch options", function() {
    describe("when the collection is not yet in storage", function() {
      it("should make a AJAX request for the collection", function() {
          collection.fetch({
            cache: true
          });

          var request = mostRecentAjaxRequest();
          expect(request.url).toEqual("testing");
      });

      describe("on success", function() {
        function sharedBehaviorForCaching(cache, key, TTL) {
          describe("(shared)", function() {
            it("should store the results in the " + cache + " cache", function() {
              var request = mostRecentAjaxRequest(),
                  response = [{
                    foo: "bar"
                  }],
                  storedObj;

              request.response({
                status: 200,
                responseText: JSON.stringify(response)
              });

              var storedObj = JSON.parse(window[cache + "Storage"][key]);
              if (TTL) {
                expect(storedObj).toEqual({
                  TTL: (new Date()).getTime() + (TTL * 1000),
                  data: response
                });
              } else {
                expect(storedObj).toEqual({
                  TTL: 0,
                  data: response
                });
              }
            });
          });
        }

        describe("when given the local cache", function() {
          beforeEach(function() {
            collection.fetch({
              cache: {
                cache: "local",
                key: "localKey"
              }
            });
          });

          sharedBehaviorForCaching("local", "localKey");
        });

        describe("when given the session cache", function() {
          beforeEach(function() {
            collection.fetch({
              cache: {
                cache: "session",
                key: "sessionKey"
              }
            });
          });

          sharedBehaviorForCaching("session", "sessionKey");
        });

        describe("when given no cache", function() {
          beforeEach(function() {
            collection.fetch({
              cache: {
                key: "noCache"
              }
            });
          });

          sharedBehaviorForCaching("session", "noCache");
        });

        describe("when given no cache key", function() {
          beforeEach(function() {
            collection.fetch({
              cache: true
            });
          });

          // it should use the collection's url
          sharedBehaviorForCaching("session", "testing");
        });

        describe("when given a TTL", function() {
          beforeEach(function() {
            collection.fetch({
              cache: {
                cache: "local",
                key: "localKey",
                TTL: 20
              }
            });
          });

          // it should store the TTL with the object
          sharedBehaviorForCaching("local", "localKey", 20);
        });
      });
    });

    describe("when the collection is in storage", function() {
      var TTL,
          responseData;

      beforeEach(function() {
        TTL = 30; // 30 seconds
        responseData = [{foo: "bar"}];

        // Load collection into cache
        collection.fetch({
          cache: {
            cache: "local",
            key: "localKey",
            TTL: TTL
          }
        });

        var request = mostRecentAjaxRequest();
        request.response({
          status: 200,
          responseText: JSON.stringify(responseData)
        });
      });

      describe("when the stored collection's TTL is up", function() {
        beforeEach(function() {
          clearAjaxRequests();

          clock.tick(1000 * TTL + 1);

          collection.fetch({
            cache: {
              cache: "local",
              key: "localKey"
            }
          });
        });

        it("should perform a AJAX fetch on the collection", function() {
          var response = mostRecentAjaxRequest();

          expect(response.url).toEqual("testing");
        });

        it("should clear the key from the cache", function() {
          expect(localStorage.localKey).toBeUndefined();
        });
      });

      describe("when the stored collection's TTL is still valid", function() {
        var onSuccess = jasmine.createSpy("onSuccess");

        beforeEach(function() {
          clearAjaxRequests();

          collection.fetch({
            cache: {
              cache: "local",
              key: "localKey"
            },
            success: onSuccess
          });
        });

        it("should not perform a AJAX fetch on the collection", function() {
          var response = mostRecentAjaxRequest();

          expect(response).toBeNull();
        });

        it("should not clear the key from the cache", function() {
          expect(localStorage.localKey).toEqual(JSON.stringify({
            TTL: (new Date()).getTime() + (TTL * 1000),
            data: responseData
          }));
        });

        it("should call the success callback with the cached response", function() {
          expect(onSuccess).toHaveBeenCalledWith(collection, responseData);
        });
      });
    });
  });

  describe("when the cache key is not in the fetch options", function() {
    it("should not store the results in cache", function() {
      collection.fetch();

      var request = mostRecentAjaxRequest();
      request.response({
        status: 200,
        responseText: {foo: "bar"}
      });

      expect(localStorage.length).toEqual(0);
      expect(sessionStorage.length).toEqual(0);
    });
  });
});
