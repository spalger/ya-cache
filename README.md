# yet another cache

Why the heck does the world need another caching module? Well, it probably doesn't but while working on [http-asset](http://github.com/spalger/http-asset) part of me was feeling crazy, part of me was feeling ambitious, and the rest of me was too lazy to sift through all the caching modules on NPM to find the one that fit the bill.

So, I offer you ya-cache.

## features

 - super simple api
 - filesystem backed
 - cache is just JSON in a file
 - filesystem locking ¯\\&#95;(ツ)&#95;/¯

## example

```js
let Cache = require('ya-cache')
let thingCache = new Cache(join(__dirname, '__cache__'))

const HOUR = 1000 * 60 * 60

let [expires, thing] = thingCache.gets('expire', 'thing')
if (expires && expires < Date.now()) {
  thing = await calculateComplexThingy()
  await thingCache.sets({
    expire: Date.now() + 24 * HOUR
    thing: thing
  })
}

doSomethingWithThing(thing)

```

## api

---
#### `new Cache(path, lockFileOptions = {})`

Constructs a cache object, provides the api to each cache


---
#### `cache.get([key]) -> Promise`

Get the value of a key, returns a promise. If the key argument is undefined then all keys and their values are returned in an object.

```js
cache.get('key').then(function (val) {
  console.log('value for key is', val)
})
```

---
#### `cache.set(key, val) -> Promise`

Set the value of a key, returns a promise.

```js
cache.set('key', 'value').then(function () {
  console.log('value for %s is now set to %s', 'key', 'value')
})
```

---
#### `cache.gets(...keys) -> Promise`

Get one or more keys, returns a promise that resolves to an array of values.

```js
cache.gets('key1', 'key2', 'key3').then(function (vals) {
  vals.forEach(function (val, i) {
    console.log('key%i has value %s', i + 1, val)
  })
})
```

---
#### `cache.sets({ key: value ... }) -> Promise`

Set one of more keys, returns a promise that resolves to an object of the saved values.

```js
cache.sets({
  key1: 'foo'
  key2: 'bar'
  key3: 'baz'
}).then(function (vals) {
  console.log('saved vals', vals)
})
```

---
#### `cache.clear([key]) -> Promise`

Clear a key in the cache. If the key is undefined then all keys are cleared

```js
cache.set('foo', 'bar')
cache.clear('foo')
cache.get('foo').then(function (val) {
  console.log('foo equals "%s"', val) // foo equals "undefined"
})
```