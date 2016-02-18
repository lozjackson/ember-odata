/**
  @module ember-odata
*/
import Ember from 'ember';
import RESTAdapter from 'ember-data/adapters/rest';

const get = Ember.get;

/**
  @class OdataAdapter
  @namespace EmberOdata
*/
export default RESTAdapter.extend({

  /**
    Query String Params.

    @property queryStringParams
    @type {Array}
  */
  queryStringParams: [],

  /**
    @method ajaxOptions
    @private
    @param {String} url
    @param {String} type The request type GET, POST, PUT, DELETE etc.
    @param {Object} options
    @return {Object}
  */
  ajaxOptions: function(url, type, options) {
    var hash = options || {};
    hash.url = url;
    hash.type = type;
    hash.dataType = 'json';
    hash.context = this;

    if (hash.data && type !== 'GET') {
      hash.contentType = 'application/json; charset=utf-8';

      // if (typeof hash.data.job !== 'undefined') {
      //   hash.data = hash.data.job;
      // }

      hash.data = JSON.stringify(hash.data);
    }

    var headers = get(this, 'headers');

    /*
      For PUT requests:
      * Change the method type to 'POST'
      * Add `X-HTTP-Method` header with the value of `MERGE`
      * Add `If-Match` header with the value of `*`
    */
    if (hash.type === 'PUT') {
      hash.type = 'POST';
      if (typeof headers === 'undefined') { headers = {}; }
      headers["X-HTTP-Method"] = "MERGE";
      headers["If-Match"] = '*';
    }

    if (headers !== undefined) {
      hash.beforeSend = function (xhr) {
        Object.keys(headers).forEach((key) =>  xhr.setRequestHeader(key, headers[key]));
      };
    }
    return hash;
  },

  /**
    @method _buildURL
    @private
    @param {String} modelName
    @param {String} id
    @return {String} url
  */
  _buildURL: function(modelName, id) {
    var url = [];
    var host = get(this, 'host');
    var prefix = this.urlPrefix();
    var path;
    let queryStringParams = this.get('queryStringParams');

    if (modelName) {
      path = this.pathForType(modelName);
      if (path) { url.push(path); }
    }

    if (id && isNaN(id)) { url.push(encodeURIComponent(id)); }
    if (prefix) { url.unshift(prefix); }

    url = url.join('/');
    if (!host && url && url.charAt(0) !== '/') {
      url = '/' + url;
    }

    /*
      Numeric `id`s should be placed inside brackets
    */
    if (!isNaN(id)) {
      url += `(${id})`;
    }

    /*
      Add custom query params to the url string
    */
    if (queryStringParams.length) {
      if (url.indexOf('?') === -1) { url += '?'; }
      url += queryStringParams.join('&');
    }

    return url;
  },

  /**
    Called by the store in order to fetch a JSON array for
    the records that match a particular query.
    The `query` method makes an Ajax (HTTP GET) request to a URL
    computed by `buildURL`, and returns a promise for the resulting
    payload.

    NOTE:  The `query` argument is appended to the url as a query string.

    @method query
    @param {DS.Store} store
    @param {DS.Model} type
    @param {Object} query
    @return {Promise} promise
  */
  query: function(store, type, query) {
    let str = '';
    let keys;
    var url = this.buildURL(type.modelName, null, null, 'query', query);

    if (this.sortQueryParams) {
      query = this.sortQueryParams(query);
    }

    keys = Object.keys(query);
    if (keys.length) {
      keys.forEach(function (key) {
        str += `${key}=${encodeURI(query[key])}`;
      });
      url += (url.indexOf('?') === -1) ? '?':'&';
      url += str;
    }
    return this.ajax(url, 'GET');
  },

  /**
    Determines the pathname for a given type.
    By default, it pluralizes the type's name (for example,
    'post' becomes 'posts' and 'person' becomes 'people').

    ### Pathname customization

    For example if you have an object LineItem with an
    endpoint of "/line_items/".

    ```app/adapters/application.js
    import ApplicationAdapter from './application';

    export default ApplicationAdapter.extend({
      pathForType: function(modelName) {
        var decamelized = Ember.String.decamelize(modelName);
        return Ember.String.pluralize(decamelized);
      }
    });
    ```
    @method pathForType
    @param {String} modelName
    @return {String} path
  **/
  pathForType: function(/*modelName*/) {
    return this._super(...arguments);
  }
});
