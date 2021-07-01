import { faLongArrowAltDown, faLongArrowAltUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const sortCaret = (order?: SortOrder | null) =>
  <>
    {' '}
    <span className='sortCarrets'>
      <FontAwesomeIcon className={order === 'asc' ? 'active' : ''} icon={faLongArrowAltDown} />
      <FontAwesomeIcon className={order === 'desc' ? 'active' : ''} icon={faLongArrowAltUp} />
    </span>
  </>

export default sortCaret
