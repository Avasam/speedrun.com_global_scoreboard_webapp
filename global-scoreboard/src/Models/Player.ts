import type { RunResult } from './UpdateRunnerResult'

type Player = {
  rank: number | undefined
  name: string
  countryCode: string | null
  score: number
  scoreDetails?: RunResult[][]
  lastUpdate: Date
  userId: string
}

export default Player

export type PlayerField = keyof Player
