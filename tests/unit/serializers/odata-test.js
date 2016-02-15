import { module, test } from 'qunit';
import OdataSerializer from 'dummy/serializers/odata';

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
  let requiredPayload = {
    posts: [
      {Id: 1, Title: 'test', Peeople: [10]}
    ]
  };
  serializer._normalizeResponse = function (store, primaryModelClass, payload) {
    Ember.Logger.log('message', primaryModelClass, payload);
    assert.equal(originalPayload, requiredPayload);
  }

  serializer.normalizeArrayResponse(null, modelClass, originalPayload);
  // assert.equal(serializer.keyForRelationship('user'), 'User', `'keyForRelationship)' method should return capitalized string`);

  // assert.equal(serializer.keyForRelationship('modifiedBy'), 'ModifiedBy', `'keyForRelationship()' method should return capitalized string`);
});
