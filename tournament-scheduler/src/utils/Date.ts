export const floorToMinutesStep = (date: Date, minutesStep: number) => {
  const coefficient = 1000 * 60 * minutesStep
  return new Date(Math.ceil(date.getTime() / coefficient) * coefficient)
}

export const tomorrow = () => {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date
}

export const tomorrowFlat = () => {
  const date = tomorrow()
  date.setHours(0, 0, 0, 0)
  return date
}

export const todayFlat = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}
