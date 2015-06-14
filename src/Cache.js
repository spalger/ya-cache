let keys = Object.keys
let debug = require('debug')('ya-cache:Cache')

let JsonFile = require('./JsonFile')
let props = require('./props')

export default class Cache {
  constructor(path, lockOpts = { wait: 5000 }) {
    this._ops = new Set()
    this._activeFlush = null
    this._file = new JsonFile(path, lockOpts)
  }

  get(key) {
    debug('getting %s', key)
    return new Promise((resolve, reject) => {
      this._ops.add({ type: 'get', key, resolve, reject })
      this._flush()
    })
  }

  set(key, val) {
    debug('setting %s to %j', key, val)
    return new Promise((resolve, reject) => {
      this._ops.add({ type: 'set', key, val, resolve, reject })
      this._flush()
    })
  }

  gets(...keys) {
    return Promise.all(keys.map(k => this.get(k)))
  }

  sets(map) {
    let sets = {}
    for (let k of keys(map)) sets[k] = this.set(k, map[k])
    return props(sets)
  }

  _flush() {
    if (this._activeFlush) return this._activeFlush;

    // don't slice yet, it's okay if it changes size
    // as soon as .update begins we prevent changes to ops,
    // but until then we allow all _ops current and future
    //
    // did this to fix a bug where .update() would fail before
    // calling the block. This prevented ops from ever getting
    // values so the error was just swallowed (no ops to tell
    // about it). Now, if an error occurs before we fork from
    // this._ops all ops will fail (thumbsup)
    let ops = this._ops
    let writtenVals = null

    this._activeFlush = this._file.update((vals) => {

      this._ops = new Set() // prevent ops from getting bigger
      debug('adding %d ops to the flush', ops.size)

      ops.forEach((op, {type, key, val, resolve}) => {
        switch (type) {
        case 'get':
          resolve(vals[key])
          ops.delete(op)
          break

        case 'set':
          vals[key] = val
          break

        default:
          throw new TypeError(`unkown op type ${type}`)
        }
      })

      return (writtenVals = vals)
    })
    .then(
      (vals) => {
        debug('update complete')
        ops.forEach((op, i) => op.resolve(writtenVals[op.key]))
      },
      (err) => {
        debug('update failed %s', err)
        ops.forEach((op, i) => op.reject(err))
      }
    )
    .then(() => {
      this._activeFlush = null;

      if (this._ops.size) {
        debug('more operations to complete, reflushing')
        return this._flush()
      }
    })

    return this._activeFlush
  }
}