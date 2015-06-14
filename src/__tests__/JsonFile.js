describe('JsonFile', ()=> {
  let JsonFile = require('../JsonFile')
  let delay = require('./.utils/delay')

  let {readFileSync, existsSync, unlinkSync} = require('fs')

  let fPath = require('path').join(__dirname, '__jsonFile__')

  let clear = ()=> existsSync(fPath) && unlinkSync(fPath)
  beforeEach(clear)
  after(clear)

  describe('#write', ()=> {
    it('puts json into the file', ()=> {
      let f = new JsonFile(fPath)
      let val = { n: Math.random() }

      return f.write(val)
      .then(()=> {
        readFileSync(fPath, 'utf8').should.equal(JSON.stringify(val))
      })
    })
  })

  describe('#read', ()=> {
    it('gets the decoded file contents', ()=> {
      let f = new JsonFile(fPath)
      let val = { n: Math.random() }

      return f.write(val)
      .then(()=> f.read())
      .should.eventually.eql(val)
    })
  })

  describe('#update', ()=> {
    it('reads from then writes to the file', ()=> {
      let f = new JsonFile(fPath)
      let val = { n: Math.random() }

      return f.write(val)
      .then(()=> f.update(v => {
        v.should.eql(val)
        val.n = Math.random()
        return { n: val.n }
      }))
      .should.eventually.eql(val)
    })

    it('keeps a lock preventing subsequent updated', ()=> {
      let f = new JsonFile(fPath)
      return f.update(()=> {
        return f.update(()=> {}).should.be.rejectedWith('EEXIST')
      })
    })

    it('keeps a lock while body executes', ()=> {
      let f = new JsonFile(fPath)
      return f.update(() => {
        return Promise.all([
          delay(10),
          delay(5).then(()=> {
            return f.update(()=> {})
            .should.be.rejectedWith('EEXIST')
          })
        ])
      })
      .then(()=> f.update())
      .should.eventually.be.fulfilled
    })

    it('waits if lockfile config passed', ()=> {
      let f = new JsonFile(fPath, { wait: 100 })
      let internal

      return f.update(()=> {
        internal = f.update()
        return delay(50)
      })
      .then(()=> internal)
      .should.eventually.be.fulfilled
    })
  })
})