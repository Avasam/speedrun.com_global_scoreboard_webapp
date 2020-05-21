export default interface Player {
  rank: number | undefined
  name: string
  countryCode: string | null
  score: number
  scoreDetails?: string
  lastUpdate: Date | string
  userId: string
}

export type PlayerField = keyof Player
