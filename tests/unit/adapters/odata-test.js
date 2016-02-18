import setupStore from 'dummy/tests/helpers/store';
import Ember from 'ember';

import {module, test} from 'qunit';

import OdataAdapter from 'dummy/adapters/odata';
// import DS from 'ember-data';

var Person, Place, store, adapter, env;
var run = Ember.run;

module("Unit | Adapter | application", {
  beforeEach: function() {
    Person = { modelName: 'person' };
    Place = { modelName: 'place' };
    env = setupStore({ adapter: OdataAdapter, person: Person, place: Place });
    store = env.store;
    adapter = env.adapter;
  },

  afterEach: function() {
    run(function() {
      store.destroy();
      env.container.destroy();
    });
  }
});

test("queryStringParams should be []", function(assert) {
  assert.expect(2);
  assert.equal(typeof adapter.get('queryStringParams'), 'object');
  assert.equal(adapter.get('queryStringParams.length'), 0);
});

test("When an id is searched, the correct url should be generated", function(assert) {
  assert.expect(2);
  var count = 0;
  adapter.ajax = function(url/*, method*/) {
    if (count === 0) { assert.equal(url, '/people(1)', "should create the correct url"); }
    if (count === 1) { assert.equal(url, '/places(1)', "should create the correct url"); }
    count++;
    return Ember.RSVP.resolve();
  };

  run(function() {
    adapter.findRecord(store, Person, 1);
    adapter.findRecord(store, Place, 1);
  });
});

test("_buildURL, the correct url should be generated", function(assert) {
  assert.expect(2);
  let url;
  adapter.queryStringParams = [
    '$select=Id,Modified,Title,StatusValue,ProblemDescription,AssignedTo/Id,Requester/Id',
    '$expand=AssignedTo,Requester'
  ];
  run(() => url = adapter._buildURL('person', 1));
  assert.equal(url, '/people(1)?$select=Id,Modified,Title,StatusValue,ProblemDescription,AssignedTo/Id,Requester/Id&$expand=AssignedTo,Requester', "should create the correct url");

  run(() => url = adapter._buildURL('person'));
  assert.equal(url, '/people?$select=Id,Modified,Title,StatusValue,ProblemDescription,AssignedTo/Id,Requester/Id&$expand=AssignedTo,Requester', "should create the correct url, with no id");
});

test("id's should be sanatized", function(assert) {
  assert.expect(1);
  adapter.ajax = function(url/*, method*/) {
    assert.equal(url, '/people/..%2Fplace%2F1', "should create the correct url");
    return Ember.RSVP.resolve();
  };
  run(function() {
    adapter.findRecord(store, Person, '../place/1');
  });
});

test("ajaxOptions() type is changed to POST when PUT request", function(assert) {
  // adapter.headers = { 'Content-Type': 'application/json' };
  var url = 'example.com';
  var type = 'PUT';
  var ajaxOptions = adapter.ajaxOptions(url, type, {});
  assert.equal(ajaxOptions.type, 'POST', `'ajaxOptions.type' should be 'POST'`);

  type = 'GET';
  ajaxOptions = adapter.ajaxOptions(url, type, {});
  assert.equal(ajaxOptions.type, 'GET', `'ajaxOptions.type' should be 'GET'`);

});

test("ajaxOptions() headers are set", function(assert) {
  adapter.headers = { 'Content-Type': 'application/json', 'Other-key': 'Other Value' };
  var url = 'example.com';
  var type = 'GET';
  var ajaxOptions = adapter.ajaxOptions(url, type, {});
  var receivedHeaders = [];
  var fakeXHR = {
    setRequestHeader: function(key, value) {
      receivedHeaders.push([key, value]);
    }
  };
  ajaxOptions.beforeSend(fakeXHR);
  assert.deepEqual(receivedHeaders, [['Content-Type', 'application/json'], ['Other-key', 'Other Value']], 'headers assigned');
});

test("ajaxOptions() X-HTTP-Method and If-Match headers are set when PUT request", function(assert) {
  var url = 'example.com';
  var type = 'PUT';
  var ajaxOptions = adapter.ajaxOptions(url, type, {});
  var receivedHeaders = [];
  var fakeXHR = {
    setRequestHeader: function(key, value) {
      receivedHeaders.push([key, value]);
    }
  };
  ajaxOptions.beforeSend(fakeXHR);
  assert.deepEqual(receivedHeaders, [['X-HTTP-Method', 'MERGE'], ['If-Match', '*']], 'headers assigned');
});

test("ajaxOptions() X-HTTP-Method headers are added to existing headers when PUT request", function(assert) {
  adapter.headers = { 'Content-Type': 'application/json' };
  var url = 'example.com';
  var type = 'PUT';
  var ajaxOptions = adapter.ajaxOptions(url, type, {});
  var receivedHeaders = [];
  var fakeXHR = {
    setRequestHeader: function(key, value) {
      receivedHeaders.push([key, value]);
    }
  };
  ajaxOptions.beforeSend(fakeXHR);
  assert.deepEqual(receivedHeaders, [['Content-Type', 'application/json'], ['X-HTTP-Method', 'MERGE'], ['If-Match', '*']], 'headers assigned');
});

test("ajaxOptions() do not serializes data when GET", function(assert) {
  var url = 'example.com';
  var type = 'GET';
  var ajaxOptions = adapter.ajaxOptions(url, type, { data: { key: 'value' } });

  assert.deepEqual(ajaxOptions, {
    context: adapter,
    data: {
      key: 'value'
    },
    dataType: 'json',
    type: 'GET',
    url: 'example.com'
  });
});

test("ajaxOptions() serializes data when not GET", function(assert) {
  var url = 'example.com';
  var type = 'POST';
  var ajaxOptions = adapter.ajaxOptions(url, type, { data: { key: 'value' } });

  assert.deepEqual(ajaxOptions, {
    contentType: "application/json; charset=utf-8",
    context: adapter,
    data: '{"key":"value"}',
    dataType: 'json',
    type: 'POST',
    url: 'example.com'
  });
});

test("ajaxOptions() empty data", function(assert) {
  var url = 'example.com';
  var type = 'POST';
  var ajaxOptions = adapter.ajaxOptions(url, type, {});

  assert.deepEqual(ajaxOptions, {
    context: adapter,
    dataType: 'json',
    type: 'POST',
    url: 'example.com'
  });
});

test('query() method', function (assert) {
  assert.expect(4);
  adapter.setProperties({
    namespace: 'api/server.php',
    ajax: (url, method, obj) => {
      assert.equal(url, '/api/server.php/people?test=1');
      assert.equal(method, 'GET');
      assert.equal(typeof obj, 'undefined');
    }
  });
  let modelType = Ember.Object.create({
    modelName: 'person'
  });
  adapter.query(null, modelType, { test: 1 });
  assert.ok(adapter);
});

test('query() method - add to existing query params', function (assert) {
  assert.expect(4);
  adapter.setProperties({
    queryStringParams: ['$select=Id,Name,Person/id', '$expand=Person'],
    namespace: 'api/server.php',
    ajax: (url, method, obj) => {
      assert.equal(url, '/api/server.php/people?$select=Id,Name,Person/id&$expand=Person&test=1');
      assert.equal(method, 'GET');
      assert.equal(typeof obj, 'undefined');
    }
  });
  let modelType = Ember.Object.create({
    modelName: 'person'
  });
  adapter.query(null, modelType, { test: 1 });
  assert.ok(adapter);
});
