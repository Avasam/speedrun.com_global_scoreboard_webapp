import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { KeyboardEvent, MouseEvent } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const stopPropagation = (event: KeyboardEvent | MouseEvent) => event.stopPropagation()

const ScoreTitle = () => <>
  {'Score '}
  <span onClick={stopPropagation} onKeyPress={stopPropagation} role='button' tabIndex={0}>
    <OverlayTrigger
      overlay={
        <Tooltip id='rankInfo'>Click on a score for a detailed view</Tooltip>
      }
      placement='top'
    >
      <FontAwesomeIcon icon={faInfoCircle} />
    </OverlayTrigger>
  </span>
</>

export default ScoreTitle
