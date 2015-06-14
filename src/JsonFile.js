let promify = require('promify')
let read = promify(require('fs').readFile)
let write = promify(require('fs').writeFile)

let withLock = require('./withLock');

export default class JsonFile {
  constructor(path, lockfileOpts) {
    this._path = path
    this._lockfile = this._path + '.lock'
    this._lockfileOpts = lockfileOpts || {}
    this._readOpts = { encoding: 'utf8' }
    this._writeOpts = { encoding: 'utf8' }
  }

  read(defaultVal) {
    return read(this._path, this._readOpts)
    .then(JSON.parse, (err)=> {
      // allow swallowing read errors
      if (defaultVal === undefined) throw err
      else return defaultVal
    })
  }

  write(val) {
    return Promise.resolve(val)
    .then(JSON.stringify)
    .then((json) => write(this._path, json, this._writeOpts))
  }

  update(block) {
    return withLock(this._lockfile, this._lockfileOpts, ()=> {
      let stash;

      return this.read({})
      // stash the stored value in scope
      .then((val) => stash = val)
      .then(block)
      .then((val) => {
        // if the block returned a new val, update our stash
        stash = val === undefined ? stash : val
        return this.write(stash)
      })
      .then(() => stash)
    })
  }
}
