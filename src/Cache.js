let keys = Object.keys

let JsonFile = require('./JsonFile')
let props = require('./props')

export default class Cache {
  constructor(path, lockOpts = { wait: 5000 }) {
    this._ops = []
    this._activeFlush = null
    this._file = new JsonFile(path, lockOpts)
  }

  get(key) {
    return new Promise((resolve, reject) => {
      this._ops.push(['get', key, null, resolve, reject])
      this._flush()
    })
  }

  set(key, val) {
    return new Promise((resolve, reject) => {
      this._ops.push(['set', key, val, resolve, reject])
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

  _flush(key) {
    if (this._activeFlush) return this._activeFlush;

    let sets = []

    this._activeFlush = this._file.update((vals) => {
      this._ops.splice(0).forEach(([op, key, val, resolve, reject]) => {
        if (op === 'get') {
          resolve(vals[key])
        }
        else if (op === 'set') {
          vals[key] = val
          sets.push([key, resolve, reject])
        }
        else {
          throw new TypeError(`unkown op type ${op}`)
        }
      })
    })
    .then(
      (vals)=> {
        for (let [key, resolve, reject] of sets) resolve(vals[key])
      },
      (err) => {
        for (let [key, resolve, reject] of sets) reject(err)
      }
    )
    .then(() => {
      this._activeFlush = null;
      return this._ops.length && this._flush();
    })

    return this._activeFlush
  }
}