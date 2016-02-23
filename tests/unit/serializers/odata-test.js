import { module, test } from 'qunit';
import OdataSerializer from 'dummy/serializers/odata';
import Ember from 'ember';
import DS from 'ember-data';

module('odata', 'Unit | Serializer | odata', {
});

test('primaryKey', function(assert) {
  let serializer = OdataSerializer.create();
  assert.equal(serializer.get('primaryKey'), 'Id', `'primaryKey' should be 'Id'`);
});

test('keyForAttribute() method should return capitalized string', function(assert) {
  let serializer = OdataSerializer.create();
  assert.equal(serializer.keyForAttribute('name'), 'Name', `'keyForAttribute()' method should return capitalized string`);

  assert.equal(serializer.keyForAttribute('fullName'), 'FullName', `'keyForAttribute()' method should return capitalized string`);
});

test('keyForRelationship() method should return capitalized string', function(assert) {
  let serializer = OdataSerializer.create();
  assert.equal(serializer.keyForRelationship('user'), 'User', `'keyForRelationship)' method should return capitalized string`);

  assert.equal(serializer.keyForRelationship('modifiedBy'), 'ModifiedBy', `'keyForRelationship()' method should return capitalized string`);
});

test('serializeAttribute() method with no changed attributes should return {}', function(assert) {
  let serializer = OdataSerializer.create();
  let json = {};
  let snapshot = {
    changedAttributes: () => {
      return {};
    },
    record: Ember.Object.create({ isNew: false })
  };
  serializer.serializeAttribute(snapshot, json, 'testKey');
  assert.equal(Object.keys(json).length, 0);
});

test('serializeAttribute() method with changed attribute', function(assert) {
  let serializer = OdataSerializer.create();
  let attribute = { type: 'string' };
  let json = {};
  serializer.transformFor = () => {
    return {
      serialize: (value) => { return value; }
    };
  };
  serializer._getMappedKey = () => { return 'testKey'; };
  let snapshot = {
    changedAttributes: () => { return {testKey: 'testValue'}; },
    attr: () => { return 'testValue'; },
    record: Ember.Object.create({ isNew: false })
  };
  serializer.serializeAttribute(snapshot, json, 'testKey', attribute);
  assert.equal(Object.keys(json).length, 1);
  assert.equal(json.TestKey, 'testValue');
});

test('serializeAttribute() method - new record', function(assert) {
  let serializer = OdataSerializer.create();
  let attribute = { type: 'string' };
  let json = {};
  serializer.transformFor = () => {
    return {
      serialize: (value) => { return value; }
    };
  };
  serializer._getMappedKey = () => { return 'testKey'; };
  let snapshot = {
    changedAttributes: () => { return {}; },
    attr: () => { return 'testValue'; },
    record: Ember.Object.create({ isNew: true })
  };
  serializer.serializeAttribute(snapshot, json, 'testKey', attribute);
  assert.equal(Object.keys(json).length, 1);
  assert.equal(json.TestKey, 'testValue');
});

test('normalizeSingleResponse() method', function(assert) {
  assert.expect(2);
  let serializer = OdataSerializer.create();
  let modelClass = 'posts@model:post:';
  let originalPayload = {
    d: {Id: 1, Title: 'test', People: [10]}
  };
  serializer._normalizeResponse = function (store, primaryModelClass, payload) {
    assert.equal(payload.post.Id, 1);
    assert.equal(payload.post.People[0], 10);
  };

  serializer.normalizeSingleResponse(null, modelClass, originalPayload);
});

test('normalizeArrayResponse() method', function(assert) {
  assert.expect(2);
  let serializer = OdataSerializer.create();
  let modelClass = 'posts@model:post:';
  let originalPayload = {
    d: {
      results: [
        {Id: 1, Title: 'test', People: [10]}
      ]
    }
  };
  serializer._normalizeResponse = function (store, primaryModelClass, payload) {
    assert.equal(payload.posts[0].Id, 1);
    assert.equal(payload.posts[0].People[0], 10);
  };

  serializer.normalizeArrayResponse(null, modelClass, originalPayload);
});

/*
  expected result:
  {
    "people": {
      "data": [
        {
          "id": "10",
          "type": "person"
        }
      ]
    }
  };
*/
test('extractRelationships() method', function(assert) {
  let serializer = OdataSerializer.create();
  let modelClass = DS.Model.extend({
    people: DS.hasMany('person')
  });
  let resourceHash = {Id: 1, Title: 'test', People: { results: Ember.A([{ Id: 10 }]) }};
  let relationships = serializer.extractRelationships(modelClass, resourceHash);
  assert.equal(relationships.people.data[0].id, 10);
  assert.equal(relationships.people.data[0].type, 'person');
});

test('extractRelationships() method - relationship with link', function(assert) {
  let serializer = OdataSerializer.create();
  let modelClass = DS.Model.extend({
    people: DS.hasMany('person')
  });
  let resourceHash = {Id: 1, Title: 'test', People: { __deferred: {uri: 'example.com/people'} }};
  let relationships = serializer.extractRelationships(modelClass, resourceHash);
  assert.equal(relationships.people.data, undefined);
  assert.equal(relationships.people.links.related, 'example.com/people');
});
