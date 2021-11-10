type LocalStorageItem = Record<string, unknown> | unknown[] | string

export const getLocalStorageItem = function <T extends LocalStorageItem>(key: string, fallback: T) {
  const item = localStorage.getItem(key)
  if (item != null && item.constructor === fallback.constructor) return JSON.parse(item) as T
  return fallback
}
