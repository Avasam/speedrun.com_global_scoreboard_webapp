import React, { useState } from 'react'
import { faHeart as faHeartSolid, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons'
import { Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHeart as faHeartEmpty } from '@fortawesome/free-regular-svg-icons'

type FriendButtonProps = {
  isFriend: boolean
  playerId: string
}

const FriendButton = (props: FriendButtonProps) => {
  const [isHovered, setIsHovered] = useState(false)

  const handleBefriendUnfriend = () =>
    props.isFriend
      ? unfriend(props.playerId)
      : befriend(props.playerId)

  const unfriend = (friendId: string) => console.log('unfriend', friendId)
  const befriend = (friendId: string) => console.log('befriend', friendId)

  return <Button
    className="float-right"
    variant="link"
    onClick={handleBefriendUnfriend}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
    {
      props.isFriend
        ? isHovered
          ? <FontAwesomeIcon className="fa-fw" color="crimson" icon={faTimes} />
          : <FontAwesomeIcon className="fa-fw" color="crimson" icon={faHeartSolid} />
        : isHovered
          ? <FontAwesomeIcon className="fa-fw" color="green" icon={faPlus} />
          : <FontAwesomeIcon className="fa-fw" color="green" icon={faHeartEmpty} />
    }
  </Button>
}

export default FriendButton
