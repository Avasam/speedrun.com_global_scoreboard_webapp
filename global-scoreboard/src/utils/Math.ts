/* eslint-disable unicorn/no-array-reduce */
const mean = (numbers: number[]) =>
  numbers.reduce((previous, current) => previous + current, 0) / numbers.length

const math = {
  mean,
}
export default math
