let promify = require('promify')
let lock = promify(require('lockfile').lock)
let unlock = promify(require('lockfile').unlock)

let isPromise = require('./isPromise')
let attempt = require('./attempt')
let after = require('./after')

export default function (path, opts, block = null) {
  if (!block && typeof opts === 'function') {
    block = opts
    opts = {}
  }

  return lock(path, opts).then(
    ()=> after(attempt(block),
      ()=> unlock(path)
    )
  )
}
