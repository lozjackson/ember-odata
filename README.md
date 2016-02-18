# Ember-odata

This Ember-cli addon is an attempt to make ember-data work with an odata api.

There is an `OdataAdapter` that extends the ember-data `RESTAdapter`.  There is
also an `OdataSerializer` that extends the `RESTSerializer`.

Tested with ember-data v2.3.0

## OdataAdapter

The `OdataAdapter` configures ember-data to work with the oData api.

### Supported methods

Currently supported adapter methods:

### GET

* `store.findAll()` can be used to retrieve all of the records for a given type.

```
store.findAll('post'); // => GET /posts
```

* `store.findRecord()` can be used to retrieve a record by its type and ID.

```
store.findRecord('post', 1); // => GET /posts(1)
```

* `store.query()` provides the ability to query for records that meet certain
criteria.  The query parameters will be appended to the url as query string parameters.

For example, query for all `post` records by the `Author` with the name of `Peter`.

```
store.query('post', { $filter: "Author/Name eq Peter" }}); // => GET /posts?$filter=Author/Name eq Peter
```

### PUT

* `model.save()` will produce a `PUT` (MERGE) request.

NOTE: when attempting a `PUT` request, the adapter will intercept the request,
change the method verb to `POST`, and set a `X-HTTP-Method` header with a value
of `MERGE`.  The `If-Match` header is also added with a value of `*`.

When performing a `MERGE` request, only the model attributes that have changed are
sent in the request.

```
model.save(); // => MERGE /posts(1)
```

### POST and DELETE

`POST` and `DELETE` have not been implemented or tested yet.


## OdataSerializer

The `OdataSerializer` normailzes, serializes, and de-serializes data from the
oData api to be consumed by ember-data.

## Relationships

* `HasMany` relationships are supported.  

* `BelongsTo` relationships have not been implemented or tested yet.

## Installation

* `npm install` this repository

## Contributing

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
