describe('after()', ()=> {
  let after = require('../after')
  let delay = require('./.utils/delay')

  let stub
  let fail
  beforeEach(()=> {
    stub = require('sinon').stub()
    fail = Promise.reject(new Error);
  })

  let slow = (fn)=> delay(5).then(fn)

  describe('called with non-promise value', ()=> {
    it('returns a promise', ()=> after().should.be.an.instanceof(Promise))

    it('executes the block', ()=> {
      let ran = false
      return after(null, ()=> ran = true).then(() => ran.should.be.true);
    })

    it('passes the value through', ()=> {
      let football = {}
      return after(football, ()=> true).should.become(football)
    })
  })

  describe('on success', ()=> {
    it('executes the block with no argument', ()=> {
      return after(1, stub)
      .then(()=> {
        stub.calledOnce.should.be.true
        stub.args[0].should.be.empty
      })
    })

    it('leaves the value untouched', ()=> {
      return after(false, ()=> true)
      .should.become(false)
    })

    it('waits for async blocks', ()=> {
      return after(1, slow(stub))
      .then(()=> stub.calledOnce.should.be.true)
    })
  })

  describe('on failure', ()=> {
    it('executes the block with no argument', ()=> {
      return after(fail, stub)
      .should.be.rejected
      .then(()=> stub.getCall(0).args.should.be.empty)
    })

    it('leaves the value untouched', ()=> {
      return after(Promise.reject(false), ()=> true)
      .should.be.rejectedWith(false)
    })

    it('waits for async blocks', ()=> {
      return after(fail, slow(stub))
      .should.be.rejected
      .then(()=> stub.calledOnce.should.be.true)
    })
  })

})