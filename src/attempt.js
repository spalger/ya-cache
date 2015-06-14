let isPromise = require('./isPromise')

export default function (block) {
  if ('function' !== typeof block) return Promise.resolve(block);

  try {
    let ret = block()
    if (isPromise(ret)) return ret
    return Promise.resolve(ret)
  }
  catch (e) { return Promise.reject(e) }
}