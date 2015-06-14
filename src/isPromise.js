export default function (x) {
  return x && ('then' in x) && ('function' === typeof x.then);
}