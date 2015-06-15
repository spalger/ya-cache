describe('FsMap', ()=> {
  let FsMap = require('../FsMap')
  let delay = require('./delay')

  let {readFileSync, writeFileSync, existsSync, unlinkSync} = require('fs')

  let fPath = require('path').join(__dirname, '__jsonFile__')

  let clear = ()=> existsSync(fPath) && unlinkSync(fPath)
  beforeEach(clear)
  after(clear)

  describe('#update', ()=> {
    it('reads from then writes to the file', async ()=> {
      let f = new FsMap(fPath)
      let n1 = Math.random()
      let j1 = JSON.stringify([['n', n1]])
      let n2 = Math.random()
      let j2 = JSON.stringify([['n', n2]])

      writeFileSync(fPath, j1, 'utf8')

      await f.update((vals)=> {
        vals.get('n').should.equal(n1)
        vals.set('n', n2)
      })

      readFileSync(fPath, 'utf8').should.equal(j2)
    })

    it('keeps a lock preventing subsequent updated', ()=> {
      let f = new FsMap(fPath)
      return f.update(()=> {
        return f.update().should.be.rejectedWith('EEXIST')
      })
    })

    it('keeps a lock while body executes', ()=> {
      let f = new FsMap(fPath)
      return f.update((vals) => {
        return Promise.all([
          delay(10),
          delay(5).then(()=> {
            return f.update().should.be.rejectedWith('EEXIST')
          })
        ])
        .then(() => vals)
      })
      .then(()=> f.update())
      .should.eventually.be.fulfilled
    })

    it('waits if lockfile config passed', ()=> {
      let f = new FsMap(fPath, { wait: 100 })
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