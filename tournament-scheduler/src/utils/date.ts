import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import timezone from 'dayjs/plugin/timezone'

import math from './math'

dayjs.extend(advancedFormat)
dayjs.extend(timezone)

type DateProperty = Date | number | string | null | undefined
type DateGetSet =
  | 'Date'
  | 'FullYear'
  | 'Hours'
  | 'Milliseconds'
  | 'Minutes'
  | 'Month'
  | 'Seconds'
  | 'Time'

const newDate = (date: DateProperty) => date == null ? new Date() : new Date(date)

// #region DateTime manipulation

export const addTime = (time: number, span: DateGetSet, from?: DateProperty) => {
  const date = newDate(from) as unknown as Record<string, (number?: number) => number>
  date[`set${span}`](date[`get${span}`]() + time)
  return date as unknown as Date
}

export const startOfDay = (from?: DateProperty) => {
  const date = newDate(from)
  date.setHours(0, 0, 0, 0)
  return date
}

export const nextDay = (from?: DateProperty) => addTime(1, 'Date', from)

export const nextDayFlat = (from?: DateProperty) => startOfDay(nextDay(from))

export const floorToMinutesStep = (date: Date, minutesStep: number) => {
  const coefficient = math.MS_IN_MINUTE * minutesStep

  return new Date(Math.ceil(date.getTime() / coefficient) * coefficient)
}

// #endregion

// From https://stackoverflow.com/a/17727953
// This drops all the hours to make sure you get a day and eliminates any DST problem by using UTC.
export const diffDays = (startDate: DateProperty, endDate?: DateProperty) => {
  const date1 = newDate(startDate)
  const date2 = newDate(endDate)
  // A day in UTC always lasts 24 hours (unlike in other time formats)
  const start = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const end = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())

  // so it's safe to divide by 24 hours
  return (end - start) / -math.MS_IN_DAY
}

export const DEADLINE_FORMAT = 'ddd MMM Do YYYY'

export const TIMESLOT_FORMAT = `${DEADLINE_FORMAT}, HH:mm`

export const FULL_FANCY_FORMAT = 'dddd MMMM Do YYYY @ HH:mm z'

export const fancyFormat = (date: Date) => dayjs(date).format(FULL_FANCY_FORMAT)
