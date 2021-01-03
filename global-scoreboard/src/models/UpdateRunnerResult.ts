import { AlertProps } from 'react-bootstrap/Alert'

import Player from './Player'
export default interface UpdateRunnerResult extends Player {
  state?: AlertProps['variant']
  message: string
}

export interface RunResult {
  gameName: string
  categoryName: string
  levelName: string | null
  points: number
  levelFraction: number
}
