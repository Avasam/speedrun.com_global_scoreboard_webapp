export default interface Player {
  rank: number | undefined
  name: string
  countryCode: string | null
  score: number
  lastUpdate: Date
  userId: string
}
