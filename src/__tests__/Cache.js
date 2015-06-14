let {join} = require('path')
let {existsSync, unlinkSync} = require('fs')

describe('Cache', ()=> {
  describe('operation order', ()=> {
    let Cache = require('../Cache')
    let cachePath = join(__dirname, '__cache__')

    let clear = ()=> existsSync(cachePath) && unlinkSync(cachePath)
    beforeEach(clear)
    after(clear)

    let cache
    beforeEach(() => cache = new Cache(cachePath))

    it('provides the correct value for interlaced gets', ()=> {
      return Promise.all([
        cache.set('foo', 'bar'),
        cache.get('foo'),
        cache.set('foo', 'baz'),
        cache.get('foo')
      ])
      .should.eventually.eql(['baz', 'bar', 'baz', 'baz'])
    })

    it('provides a multi-get and multi-set api', function () {
      return cache.sets({
        a: 1,
        b: 2
      })
      .then(function () {
        return cache.gets('a', 'b')
      })
      .should.eventually.eql([1, 2])
    })

    it('operations registered during another operation are caried out properly', ()=> {
      return cache.sets({
        a: 1,
        b: 3,
        c: 2
      })
      .then(function () {
        return Promise.all([
          cache.get('a'),

          cache.get('b').then(function (b) {
            return cache.set('c', b)
          })
          .then(function () {
            return cache.get('b')
          }),

          cache.set('b', 2)
          .then(function () {
            return cache.get('c')
          })
        ])
      })
      .should.eventually.eql([1,2,3])
    })
  })
})