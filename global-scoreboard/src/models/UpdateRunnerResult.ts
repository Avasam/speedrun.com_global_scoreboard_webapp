import { AlertProps } from 'react-bootstrap/Alert'
import Player from './Player'
export default interface UpdateRunnerResult extends Player {
  state: AlertProps['variant']
  message: string
}
