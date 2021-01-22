import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

const ScoreTitle = () => <>
  {'Score '}
  <span onClick={event => event.stopPropagation()}>
    <OverlayTrigger
      placement='bottom'
      overlay={
        <Tooltip
          id='rankInfo'
        >Click on a blue score for a detailed view</Tooltip>
      }
    >
      <FontAwesomeIcon icon={faInfoCircle} />
    </OverlayTrigger>
  </span>
</>

export default ScoreTitle
