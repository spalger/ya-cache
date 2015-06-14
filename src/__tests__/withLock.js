describe('withLock()', function () {
  let testLockFile = require('path').join(__dirname, '.lockfile')
  let {unlinkSync, existsSync} = require('fs')

  let withLock = require('../withLock')
  let delay = requireRoot('test/utils/delay')

  beforeEach(function () {
    try { unlinkSync(testLockFile) } catch (e) {}
  })

  describe('(path, block:fn -> Promise)', function () {
    it('waits for the blocks promise to complete', function () {
      let ran = false
      return withLock(testLockFile, ()=> {
        return delay(4).then(() => {
          existsSync(testLockFile).should.be.true
          ran = true
        })
      })
      .then(()=> ran.should.be.true)
    })

    it('unlocks when the block fails', function () {
      return withLock(testLockFile, ()=> { throw new Error })
      .should.be.rejectedWith(Error)
      .then(function () {
        existsSync(testLockFile).should.be.false
      })
    })
  })
})