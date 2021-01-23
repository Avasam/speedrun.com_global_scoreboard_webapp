import type { AlertProps } from 'react-bootstrap/Alert'

import type Player from './Player'
type UpdateRunnerResult =
  Player &
  {
    state?: AlertProps['variant']
    message: string
  }
export default UpdateRunnerResult

export type RunResult = {
  gameName: string
  categoryName: string
  levelName: string | null
  points: number
  levelFraction: number
}
