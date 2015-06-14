var attempt = require('./attempt');

let sneakIn = (block, type)=> (x) => {
  let done = ()=> Promise[type](x)
  return attempt(block).then(done, done)
}

export default function (x, block) {
  return Promise.resolve(x).then(
    sneakIn(block, 'resolve'),
    sneakIn(block, 'reject')
  )
}