import { Button, Table } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import FriendButton from './FriendButton'
import Player from '../models/Player'
import React from 'react'
import { faArrowAltCircleRight } from '@fortawesome/free-solid-svg-icons'

type QuickViewProps = {
  friends: Player[]
  currentUser: Player | null
  onJumpToPlayer: (playerId: string) => void
}

const QuickView = (props: QuickViewProps) =>
  <>
    <label>Quick view:</label>
    <Table striped>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th colSpan={2}>Score</th>
        </tr>
      </thead>
      <tbody>
        <tr className="highlight-current-user" id={`preview-${props.currentUser?.userId}`}>
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
                  onClick={() => props.currentUser && props.onJumpToPlayer(props.currentUser.userId)}
                >
                  <FontAwesomeIcon icon={faArrowAltCircleRight} />
                </Button>
              </td>
            </>
            : <td colSpan={4}></td>
          }
        </tr>
        {props.currentUser
          ? props.friends.sort((a, b) => b.score - a.score).map(friend =>
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
                  onClick={() => props.onJumpToPlayer(friend.userId)}
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
    </Table>
  </>

export default QuickView
