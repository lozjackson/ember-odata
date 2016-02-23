/**
  @module ember-odata
*/
import Ember from 'ember';
import RESTSerializer from 'ember-data/serializers/rest';

/**
  @class OdataSerializer
  @namespace EmberOdata
*/
export default RESTSerializer.extend({

  /**
    The `primaryKey` is used when serializing and deserializing
    data. Ember Data always uses the `id` property to store the id of
    the record. The external source may not always follow this
    convention. In these cases it is useful to override the
    `primaryKey` property to match the `primaryKey` of your external
    store.
    Example
    ```app/serializers/application.js
    import DS from 'ember-data';
    export default DS.JSONSerializer.extend({
      primaryKey: '_id'
    });
    ```
    @property primaryKey
    @type {String}
    @default `Id`
  */
  primaryKey: 'Id',

  /**
   `keyForAttribute` can be used to define rules for how to convert an
   attribute name in your model to a key in your JSON.
   Example
   ```app/serializers/application.js
   import DS from 'ember-data';
   export default DS.RESTSerializer.extend({
     keyForAttribute: function(attr, method) {
       return Ember.String.underscore(attr).toUpperCase();
     }
   });
   ```
   @method keyForAttribute
   @param {String} key
   @param {String} method
   @return {String} normalized key
  */
  keyForAttribute(attr/*, method*/) {
    return Ember.String.capitalize(attr);
  },

  /**
   `keyForRelationship` can be used to define a custom key when
   serializing and deserializing relationship properties. By default
   `JSONSerializer` does not provide an implementation of this method.
   Example
    ```app/serializers/post.js
    import DS from 'ember-data';
    export default DS.JSONSerializer.extend({
      keyForRelationship: function(key, relationship, method) {
        return 'rel_' + Ember.String.underscore(key);
      }
    });
    ```
   @method keyForRelationship
   @param {String} key
   @param {String} typeClass
   @param {String} method
   @return {String} normalized key
  */
  keyForRelationship(key/*, relationship, method*/) {
    return Ember.String.capitalize(key);
  },

  /**

   `serializeAttribute` can be used to customize how `DS.attr`
   properties are serialized
   For example if you wanted to ensure all your attributes were always
   serialized as properties on an `attributes` object you could
   write:
   ```app/serializers/application.js
   import DS from 'ember-data';
   export default DS.JSONSerializer.extend({
     serializeAttribute: function(snapshot, json, key, attributes) {
       json.attributes = json.attributes || {};
       this._super(snapshot, json.attributes, key, attributes);
     }
   });
   ```

   @method serializeAttribute
   @param {DS.Snapshot} snapshot
   @param {Object} json
   @param {String} key
   @param {Object} attribute
  */
  serializeAttribute(snapshot, json, key, attribute) {
    if (key !== 'modified') {
      if ( snapshot.changedAttributes()[key] || snapshot.record.get('isNew')) {
        return this._super(snapshot, json, key, attribute);
      } else {
        return;
      }
    }
  },

  /**
    @method normalizeSingleResponse
    @param {DS.Store} store
    @param {DS.Model} primaryModelClass
    @param {Object} payload
    @param {String|Number} id
    @param {String} requestType
    @return {Object} JSON-API Document
  */
  normalizeSingleResponse(store, primaryModelClass, payload, id, requestType) {
    if (payload.d) {
      let key = String(primaryModelClass).split(':')[1];
      if (payload.d) {
        payload = { [key]: payload.d };
      }
    }
    return this._normalizeResponse(store, primaryModelClass, payload, id, requestType, true);
  },

  /**

    ```
    {
      d: {
        results: [
          {Id: 1, Title: 'test', Peeople: [10]}
        ]
      }
    }
    ```

    should be normailzed to:

    ```
    {
      posts: [
        {Id: 1, Title: 'test', Peeople: [10]}
      ]
    }
    ```

    @method normalizeArrayResponse
    @param {DS.Store} store
    @param {DS.Model} primaryModelClass
    @param {Object} payload
    @param {String|Number} id
    @param {String} requestType
    @return {Object} JSON-API Document
  */
  normalizeArrayResponse(store, primaryModelClass, payload, id, requestType) {
    if (payload.d) {
      let key = String(primaryModelClass).split(':')[1];
      key = Ember.String.pluralize(key);
      if (payload.d.results) {
        payload = { [key]: payload.d.results };
      }
    }
    return this._normalizeResponse(store, primaryModelClass, payload, id, requestType, false);
  },

  /**
    Returns the resource's relationships formatted as a JSON-API "relationships object".
    http://jsonapi.org/format/#document-resource-object-relationships
    @method extractRelationships
    @param {Object} modelClass
    @param {Object} resourceHash
    @return {Object}
  */
  extractRelationships(modelClass, resourceHash) {
    let relationships = {};


    modelClass.eachRelationship((key, relationshipMeta) => {
      let relationship = null;
      let relationshipKey = this.keyForRelationship(key, relationshipMeta.kind, 'deserialize');
      if (resourceHash.hasOwnProperty(relationshipKey)) {
        let data = null;
        let relationshipHash = resourceHash[relationshipKey];

        if (relationshipMeta.kind === 'belongsTo') {
          if (relationshipMeta.options.polymorphic) {
            // extracting a polymorphic belongsTo may need more information
            // than the type and the hash (which might only be an id) for the
            // relationship, hence we pass the key, resource and
            // relationshipMeta too
            data = this.extractPolymorphicRelationship(relationshipMeta.type, relationshipHash, { key, resourceHash, relationshipMeta });
          } else {
            data = this.extractRelationship(relationshipMeta.type, relationshipHash);
          }
        } else if (relationshipMeta.kind === 'hasMany') {

          if (!Ember.isNone(relationshipHash)) {

            //////////////
            //  convert the relationships hash from the format that odata delivers
            //  to the format that ember-data expects
            if (typeof relationshipHash.results !== 'undefined') {
              relationshipHash = relationshipHash.results.mapBy('Id');
              resourceHash[relationshipKey] = relationshipHash;
            } else if (typeof relationshipHash.__deferred !== 'undefined') {
              if (typeof resourceHash.links === 'undefined') {
                resourceHash.links = {};
              }
              resourceHash.links[key] = relationshipHash.__deferred.uri;
              // delete relationshipHash.__deferred;
              delete resourceHash[relationshipKey];
              relationshipHash = null;
            }
            //////////////

            if (relationshipHash) {
              data = new Array(relationshipHash.length);
              for (let i = 0, l = relationshipHash.length; i < l; i++) {
                let item = relationshipHash[i];
                data[i] = this.extractRelationship(relationshipMeta.type, item);
              }
            }
          }
        }
        relationship = { data };
      }

      let linkKey = this.keyForLink(key, relationshipMeta.kind);
      if (resourceHash.links && resourceHash.links.hasOwnProperty(linkKey)) {
        let related = resourceHash.links[linkKey];
        relationship = relationship || {};
        relationship.links = { related };
      }

      if (relationship) {
        relationships[key] = relationship;
      }
    });

    return relationships;
  }
});
