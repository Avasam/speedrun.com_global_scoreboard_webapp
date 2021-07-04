import type { Variant } from 'react-bootstrap/esm/types'

import type Player from './Player'
type UpdateRunnerResult =
  Player &
  {
    state?: Variant
    message?: string
  }
export default UpdateRunnerResult

export type RunResult = {
  gameName: string
  categoryName: string
  levelName: string | null
  points: number
  levelFraction: number
}
