let keys = Object.keys
let debug = require('debug')('ya-cache:Cache')

let FsMap = require('./FsMap')

const allKeys = Symbol('allKeys')
const noError = Symbol('noError')

export default class Cache {
  constructor(path, lockOpts = { wait: 5000 }) {
    this._ops = new Set()
    this._file = new FsMap(path, lockOpts)
  }

  get(key = allKeys) {
    debug('getting %s', key)
    return new Promise((resolve, reject) => {
      this._ops.add({ type: 'get', key, resolve, reject })
      this.flush()
    })
  }

  set(key, val) {
    debug('setting %s to %j', key, val)
    return new Promise((resolve, reject) => {
      this._ops.add({ type: 'set', key, val, resolve, reject })
      this.flush()
    })
  }

  gets(...keys) {
    return Promise.all(keys.map(k => this.get(k)))
  }

  sets(vals) {
    return Promise.all(
      keys(vals).map( k => this.set(k, vals[k]) )
    )
  }

  clear(key = allKeys) {
    return new Promise((resolve, reject) => {
      this._ops.add({ type: 'clear', key, resolve, reject })
      this.flush()
    })
  }

  flush() {
    return this._activeFlush || (this._activeFlush = this._flush());
  }

  // the return value of this async function is generally ignored so make
  // sure we handle the error or at least log it
  async _flush() {
    try {

      let ops = this._ops
      let updateErr = noError
      try {
        await this._file.update((vals) => {
          debug('flushing %d ops', ops.size)
          this._ops = new Set() // we have begun, no more noobs

          ops.forEach((op, {type, key, val, resolve}) => {
            switch (type) {
            case 'get':
              if (key === allKeys) {
                let all = {}
                for (let [key, val] of vals.entries()) all[key] = val
                debug('get all keys', all)
                resolve(all)
              } else {
                resolve(vals.get(key))
              }

              ops.delete(op)
              break

            case 'set':
              vals.set(key, val)
              break

            case 'clear':
              if (key === allKeys) vals.clear()
              else vals.delete(key)
              break

            default:
              throw new TypeError(`unkown op type ${type}`)
            }
          })
        })
      } catch (e) {
        updateErr = e
      }

      if (updateErr === noError) {
        debug('update complete')
        ops.forEach((op) => op.resolve())
      } else {
        debug('update failed %s', updateErr)
        ops.forEach((op) => op.reject(updateErr))
      }
    }
    catch (err) {
      console.log('Unhandled exceptions while flushing cache')
      console.log((err && (err.stack || err.message)) || err)
    }
    finally {
      this._activeFlush = null

      if (this._ops.size) {
        debug('more operations to complete, reflushing')
        await this._flush()
      }
    }
  }
}