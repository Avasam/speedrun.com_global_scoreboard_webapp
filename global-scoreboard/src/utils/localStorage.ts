type LocalStorageItem = Record<string, unknown> | unknown[] | string

export const getLocalStorageItem = <T extends LocalStorageItem>(key: string, fallback: T) => {
  const item = localStorage.getItem(key)

  return item != null && item.constructor === fallback.constructor
    ? JSON.parse(item) as T
    : fallback
}
