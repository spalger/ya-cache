describe('attempt()', ()=> {

  let should = require('chai').should()

  let attempt = require('../attempt')

  class Failed extends Error {}

  describe('called with nothing', ()=> {
    it('resolves to null', ()=> attempt(null).should.become(null))
    it('resolves to undefined', ()=> attempt(undefined).should.become(undefined))
  })

  describe('called with value', ()=> {
    it('resolves to number', ()=> attempt(1).should.become(1))
    it('resolves to boolean', ()=> attempt(true).should.become(true))
    it('resolves to string', ()=> attempt(true).should.become(true))
    it('resolves to error', ()=> attempt(new Failed).should.eventually.be.an.instanceof(Failed))
  })

  describe('called with a function that throws synchronously', ()=> {
    it('rejects with that error', ()=>
      attempt(() => { throw new Failed }).should.eventually.be.rejectedWith(Failed)
    )
  })

});