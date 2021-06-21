// eslint-disable-next-line @typescript-eslint/no-explicit-any
type URecord = Record<string, Record<string, any>>

export const isObject = (item: unknown): item is URecord =>
  !!(item && typeof item === 'object' && !Array.isArray(item))

/** 
 * Usage:
 * `mergeDeep(this, { a: { b: { c: 123 } } })`
 * or
 * `const merged = mergeDeep({a: 1}, { b : { c: { d: { e: 12345}}}})`
 */
export function mergeDeep(target: unknown, source: unknown) {
  const output: URecord = Object.assign({}, target)
  if (isObject(target) && isObject(source)) {
    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] })
        else
          output[key] = mergeDeep(target[key], source[key])
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    }
  }

  return output
}
