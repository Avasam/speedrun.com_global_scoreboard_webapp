import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { forwardRef } from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

// Maybe this will be simplified in the future: https://github.com/FortAwesome/react-fontawesome/issues/199
const FaInfoCircle = forwardRef((props, ref) => <FontAwesomeIcon forwardedRef={ref} icon={faInfoCircle} {...props} />)
FaInfoCircle.displayName = 'FaInfoCircle'

const ScoreTitle = () => <>
  {'Score '}
  <span onClick={event => event.stopPropagation()}>
    <OverlayTrigger
      placement='top'
      overlay={
        <Tooltip id='rankInfo'>Click on a blue score for a detailed view</Tooltip>
      }
    ><FaInfoCircle />
    </OverlayTrigger>
  </span>
</>

export default ScoreTitle
