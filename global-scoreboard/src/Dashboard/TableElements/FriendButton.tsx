import { faHeart as faHeartSolid, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart as faHeartEmpty } from '@fortawesome/free-regular-svg-icons'
import { useState } from 'react'

type FriendButtonProps = {
  isFriend: boolean
  playerId: string
  onUnfriend: (friendId: string) => void
  onBefriend: (friendId: string) => void
}

const FriendButton = (props: FriendButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleBefriendUnfriend = () =>
    props.isFriend
      ? props.onUnfriend(props.playerId)
      : props.onBefriend(props.playerId)

  return <Button
    variant='link'
    onClick={handleBefriendUnfriend}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    {
      props.isFriend
        ? isHovered
          ? <FontAwesomeIcon className='fa-fw' color='crimson' icon={faTimes} />
          : <FontAwesomeIcon className='fa-fw' color='crimson' icon={faHeartSolid} />
        : isHovered
          ? <FontAwesomeIcon className='fa-fw' color='green' icon={faPlus} />
          : <FontAwesomeIcon className='fa-fw' color='green' icon={faHeartEmpty} />
    }
  </Button>
}

export default FriendButton
