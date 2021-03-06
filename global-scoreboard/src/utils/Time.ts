import math from './Math'

export const secondsToTimeString = (totalSeconds: number) => {
  const hours = Math.trunc(totalSeconds / math.SECONDS_IN_HOUR).toString().padStart(2, '0')
  totalSeconds %= math.SECONDS_IN_HOUR
  const minutes = Math.trunc(totalSeconds / math.SECONDS_IN_MINUTE).toString().padStart(2, '0')
  const seconds = Math.trunc(totalSeconds % math.SECONDS_IN_MINUTE).toString().padStart(2, '0')

  return `${hours}:${minutes}:${seconds}`
}

export const timeStringToSeconds = (timeString: string) => {
  if (!timeString) return ''
  const time = timeString.split(':')
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const hour = time[time.length - 3] ?? '0'
  const min = time[time.length - 2] ?? '0'
  const sec = time[time.length - 1]

  return +hour * math.SECONDS_IN_HOUR + +min * math.SECONDS_IN_MINUTE + +sec
}

// From https://stackoverflow.com/a/17727953
// This drops all the hours to make sure you get a day and eliminates any DST problem by using UTC.
export const diffDays = (startDate: Date, endDate: Date) => {
  // A day in UTC always lasts 24 hours (unlike in other time formats)
  const start = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
  const end = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

  // so it's safe to divide by 24 hours
  return (end - start) / -math.MS_IN_DAY
}
