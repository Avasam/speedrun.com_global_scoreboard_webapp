type LocalStorageItem = Record<string, unknown> | unknown[] | boolean | string

export const getLocalStorageItem = <T extends LocalStorageItem>(key: string, fallback: T) => {
  const item = localStorage.getItem(key)
  if (typeof fallback === 'boolean') {
    switch (item){
      case 'true': return true as T
      case 'false': return false as T
      default: return fallback
    }
  }

  if (item == null) return fallback
  try {
    return JSON.parse(item) as T
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

export const setLocalStorageItem = (key: string, item: LocalStorageItem) =>
  localStorage.setItem(key, JSON.stringify(item))
