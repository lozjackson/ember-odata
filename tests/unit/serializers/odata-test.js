import { module, test } from 'qunit';
import OdataSerializer from 'dummy/serializers/odata';
import Ember from 'ember';

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

test('normalizeArrayResponse() method', function(assert) {
  assert.expect(1);
  let serializer = OdataSerializer.create();
  let modelClass = 'posts@model:post:';
  let originalPayload = {
    d: {
      results: [
        {Id: 1, Title: 'test', Peeople: [10]}
      ]
    }
  };
  serializer._normalizeResponse = function (store, primaryModelClass, payload) {
    assert.equal(payload.posts[0].Id, 1);
  };

  serializer.normalizeArrayResponse(null, modelClass, originalPayload);
});
