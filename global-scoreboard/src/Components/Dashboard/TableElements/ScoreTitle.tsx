import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { KeyboardEvent, MouseEvent } from 'react'
import { forwardRef } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

// Maybe this will be simplified in the future: https://github.com/FortAwesome/react-fontawesome/issues/199
const FaInfoCircle = forwardRef((props, ref) => <FontAwesomeIcon forwardedRef={ref} icon={faInfoCircle} {...props} />)
FaInfoCircle.displayName = 'FaInfoCircle'

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
      <FaInfoCircle />
    </OverlayTrigger>
  </span>
</>

export default ScoreTitle
