let keys = Object.keys

export default function props(obj) {
  let promises = [];
  let res = {}

  for (let k of keys(obj)) {
    promises.push(
      Promise.resolve(obj[k]).then((v) => res[k] = v)
    )
  }

  return Promise.all(promises).then(() => res)
}