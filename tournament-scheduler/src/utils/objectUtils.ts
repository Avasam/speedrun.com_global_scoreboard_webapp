type JSONPropsBase = boolean | number | string | null | undefined
type JSONProps = JSONPropsBase | Record<string, JSONPropsBase> | unknown[]

type JSONPropertyNames<T> = { [K in keyof T]: T[K] extends JSONProps ? K : never }[keyof T]
export type JSONProperties<T> = Pick<T, JSONPropertyNames<T>>

// https://stackoverflow.com/a/58210459
// eslint-disable-next-line @typescript-eslint/ban-types
type FunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? K : never }[keyof T]
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>

// eslint-disable-next-line @typescript-eslint/ban-types
type NonFunctionPropertyNames<T> = { [K in keyof T]: T[K] extends Function ? never : K }[keyof T]
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>

export const createProxy = <T>(object: T) =>
  JSON.parse(JSON.stringify(object)) as (T extends JSONProperties<unknown>[] ? T : JSONProperties<T>)

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
export const mergeDeep = (target: unknown, source: unknown) => {
  const output: URecord = Object.assign({}, target)
  if (isObject(target) && isObject(source)) {
    for (const key of Object.keys(source)) {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = mergeDeep(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    }
  }

  return output
}

// https://stackoverflow.com/a/5306832
export const arrayMove = <T>(array: T[], oldIndex: number, newIndex: number) => {
  while (oldIndex < 0) {
    oldIndex += array.length
  }
  while (newIndex < 0) {
    newIndex += array.length
  }
  if (newIndex >= array.length) {
    let k = newIndex - array.length + 1
    while (k--) {
      // hacky workaround. Not sure if we'll actually get undefined in the end
      array.push(undefined as unknown as T)
    }
  }
  array.splice(newIndex, 0, array.splice(oldIndex, 1)[0])
  return array // for testing purposes
}
