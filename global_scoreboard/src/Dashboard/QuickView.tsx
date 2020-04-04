import { Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import FriendButton from './FriendButton'
import Player from '../models/Player'
import React from 'react'
import { faArrowAltCircleRight } from '@fortawesome/free-solid-svg-icons'

type QuickViewProps = {
  friends: Player[]
  currentUser: Player
  jumpToPlayer: (playerId: string) => void
}

const QuickView = (props: QuickViewProps) => {

  return <>
    <label htmlFor="preview">Quick view:</label>
    <table className="table" id="preview">
      <tbody>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th colSpan={2}>Score</th>
        </tr>
        <tr className="highlight-current-user" id={`preview-${props.currentUser.userId}`}>
          {props.currentUser
            ? <>
              <td>{props.currentUser.rank}</td>
              <td>
                <a
                  href={`https://speedrun.com/user/${props.currentUser.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >{props.currentUser.name}</a>
              </td>
              <td>{props.currentUser.score}</td>
              <td>
                <Button
                  className="float-right"
                  variant="link"
                  onClick={() => props.jumpToPlayer(props.currentUser.userId)}
                >
                  <FontAwesomeIcon icon={faArrowAltCircleRight} />
                </Button>
              </td>
            </>
            : <td colSpan={4}></td>
          }
        </tr>
        {props.currentUser
          ? props.friends.map(friend =>
            <tr className="highlight-friend" id={`preview-${friend.userId}`} key={`preview-${friend.userId}`}>
              <td>{friend.rank}</td>
              <td>
                <a
                  href={`https://speedrun.com/user/${friend.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >{friend.name}</a>
                <FriendButton isFriend={true} playerId={friend.userId} />
              </td>
              <td>{friend.score}</td>
              <td>
                <Button
                  className="float-right"
                  variant="link"
                  onClick={() => props.jumpToPlayer(friend.userId)}
                >
                  <FontAwesomeIcon icon={faArrowAltCircleRight} />
                </Button>
              </td>
            </tr>
          )
          : <tr className="highlight-friend">
            <td colSpan={4}></td>
          </tr>
        }
      </tbody>
    </table>
  </>
}

export default QuickView
