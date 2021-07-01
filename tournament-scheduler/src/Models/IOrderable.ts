type IOrderable = {
  order: number
}

export default IOrderable

export type IOrderableProps<T> = {
  onMove: (schedule: T, upDown: -1 | 1) => void
  isFirst: boolean
  isLast: boolean
}
