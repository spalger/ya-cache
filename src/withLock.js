let lockfile = require('lockfile')
let fs = require('fs')
let promify = require('promify')
let {dirname} = require('path')

let debug = require('debug')('ya-cache:withLock')
let lock = promify(lockfile.lock)
let unlock = promify(lockfile.unlock)
let mkdirp = promify(require('mkdirp'))
let exists = (path) => new Promise((resolve)=> fs.exists(path, resolve))

const NOERR = function(){}

export default async (path, opts, block = null)=> {
  if (!block && typeof opts === 'function') {
    block = opts
    opts = {}
  }

  let dir = dirname(path);
  if (!await exists(dir)) await mkdirp(dir)

  await lock(path, opts)
  debug('locked', path)

  let ret
  let err = NOERR

  try {
    ret = await block()
  } catch (e) {
    err = e
  }

  await unlock(path)
  debug('unlocked %s', path)

  if (err !== NOERR) throw err
  else return ret
}
