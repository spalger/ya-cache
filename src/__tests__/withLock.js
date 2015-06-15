describe('withLock()', function () {
  let lPath = require('path').join(__dirname, '.lockfile')
  let {unlinkSync, existsSync} = require('fs')

  let withLock = require('../withLock')
  let delay = require('./delay')

  beforeEach(function () {
    try { unlinkSync(lPath) } catch (e) {}
  })

  describe('(path, block:fn -> Promise)', function () {
    it('waits for the blocks promise to complete', function () {
      let ran = false
      return withLock(lPath, ()=> {
        return delay(4).then(() => {
          existsSync(lPath).should.be.true
          ran = true
        })
      })
      .then(()=> ran.should.be.true)
    })

    it('unlocks when the block fails', function () {
      return withLock(lPath, ()=> { throw new Error })
      .should.be.rejectedWith(Error)
      .then(function () {
        existsSync(lPath).should.be.false
      })
    })
  })
})