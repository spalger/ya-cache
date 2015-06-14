let promify = require('promify')
let fs = require('fs')
let debug = require('debug')('ya-cache:JsonFile')

let read = promify(fs.readFile)
let write = promify(fs.writeFile)

let withLock = require('./withLock');

const DEFAULT = function () {}

export default class JsonFile {
  constructor(path, lockfileOpts) {
    this._path = path
    this._fd = null
    this._fdRefCount = 0
    this._lockfile = this._path + '.lock'
    this._lockfileOpts = lockfileOpts || {}
    this._readOpts = { encoding: 'utf8' }
    this._writeOpts = { encoding: 'utf8' }
  }

  async read(defaultVal) {
    debug('reading %s with default: %s', this._path, defaultVal)
    let json = DEFAULT
    try { json = await read(this._path, this._readOpts) } catch (e) {}

    return json === DEFAULT ? defaultVal : JSON.parse(json)
  }

  async write(val) {
    debug('writing %s', this._path)
    let json = JSON.stringify(val)
    await write(this._path, json, this._writeOpts)
  }

  async update(block) {
    debug('updating %s', this._path)

    // ask for the file descriptor so that it sticks around
    // for all of this call
    return await withLock(this._lockfile, this._lockfileOpts, async ()=> {
      let stash = await this.read({})

      let newStash = block ? await block(stash) : undefined;
      if (newStash !== undefined) stash = newStash

      await this.write(stash)
      return stash
    })
  }
}
