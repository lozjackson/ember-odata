import { module, test } from 'qunit';
import ApplicationSerializer from 'dummy/serializers/application';

module('application', 'Unit | Serializer | application', {
});

test('primaryKey', function(assert) {
  let serializer = ApplicationSerializer.create();
  assert.equal(serializer.get('primaryKey'), 'Id', `'primaryKey' should be 'Id'`);
});

test('keyForAttribute() method should return capitalized string', function(assert) {
  let serializer = ApplicationSerializer.create();
  assert.equal(serializer.keyForAttribute('name'), 'Name', `'keyForAttribute()' method should return capitalized string`);

  assert.equal(serializer.keyForAttribute('fullName'), 'FullName', `'keyForAttribute()' method should return capitalized string`);
});

test('keyForRelationship() method should return capitalized string', function(assert) {
  let serializer = ApplicationSerializer.create();
  assert.equal(serializer.keyForRelationship('user'), 'User', `'keyForRelationship)' method should return capitalized string`);

  assert.equal(serializer.keyForRelationship('modifiedBy'), 'ModifiedBy', `'keyForRelationship()' method should return capitalized string`);
});
