/* eslint-disable extra-rules/no-commented-out-code */
/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable unicorn/no-array-reduce */
const mean = (numbers: number[]) =>
  numbers.reduce((previous, current) => previous + current, 0) / numbers.length

const roundToDecimals = (number: number, decimals = 2) => {
  const rounder = 10 ^ decimals

  return Math.round(number * rounder) / rounder
}

const perSecondToPerMinute = (number: number) =>
  Math.trunc(number * 600) / 10

const math = {
  mean,
  roundToDecimals,
  perSecondToPerMinute,
  SECONDS_IN_MINUTE: 60,
  SECONDS_IN_HOUR: 3600,
  MS_IN_SECOND: 1000,
  MS_IN_MINUTE: 60_000,
  MS_IN_DAY: 86_400_000, // 1000 * 60 * 60 * 24
  HALF: 0.5,
  QUARTER: 0.25,
}

export default math
