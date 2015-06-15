let promify = require('promify')
let fs = require('fs')
let debug = require('debug')('ya-cache:FsMap')

let read = promify(fs.readFile)
let write = promify(fs.writeFile)

let withLock = require('./withLock');

export default class FsMap {
  constructor(path, lockfileOpts) {
    this._path = path
    this._fd = null
    this._fdRefCount = 0
    this._lockfile = this._path + '.lock'
    this._lockfileOpts = lockfileOpts || {}
    this._readOpts = { encoding: 'utf8' }
    this._writeOpts = { encoding: 'utf8' }
  }

  async update(block) {
    debug('updating %s', this._path)

    // ask for the file descriptor so that it sticks around
    // for all of this call
    await withLock(this._lockfile, this._lockfileOpts, async ()=> {
      // read json from file
      let json = undefined
      let exists = false
      try {
        json = await read(this._path, this._readOpts)
        exists = true
        debug('cache file exists')
      } catch(e) {}

      // parse json into vals object
      let entries = undefined
      let valid = false
      try {
        entries = JSON.parse(json)
        valid = true
        debug('cache contains valid json')
      } catch(e) {}

      // if we had a file, but it didn't parse to json, abort
      if (!valid && exists) {
        throw new Error('Invalid JSON in FsMap - %s', this._path)
      }

      // convert our entries to a map and call the block
      let stash = new Map(entries)
      await (block && block(stash))
      debug('block applied %j', stash)

      if (!stash.size) {
        if (exists) await unlink(this._path)
        return null
      }

      await write(this._path, JSON.stringify(stash), this._writeOpts)

      debug('cache written back to fs')
      return stash
    })
  }
}
