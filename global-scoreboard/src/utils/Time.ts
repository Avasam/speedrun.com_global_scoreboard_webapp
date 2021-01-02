export const secondsToTimeString = (totalSeconds: number) => {
  const hours = Math.trunc(totalSeconds / 3600)
  totalSeconds %= 3600
  const minutes = Math.trunc(totalSeconds / 60)
  const seconds = Math.trunc(totalSeconds % 60)
  return `${hours.toString().padStart(2, '0')}:${
    minutes.toString().padStart(2, '0')}:${
    seconds.toString().padStart(2, '0')}`
}

export const timeStringToSeconds = (timeString: string) => {
  if (!timeString) return ''
  const time = timeString.split(':')
  const hour = time[time.length - 3] ?? '0'
  const min = time[time.length - 2] ?? '0'
  const sec = time[time.length - 1]
  return +hour * 3600 + +min * 60 + +sec
}
