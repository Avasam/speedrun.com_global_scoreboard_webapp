import './QuickView.css'
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
  onUnfriend: (playerId: string) => void
  onBefriend: (playerId: string) => void
}

const QuickView = (props: QuickViewProps) =>
  <>
    <label>Quick view:</label>
    <div className="table-responsive-lg">
      <Table striped>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th colSpan={2}>Score</th>
          </tr>
        </thead>
        <tbody>
          {
            props.currentUser
              ? [...props.friends, props.currentUser]
                .sort((a, b) => b.score - a.score)
                .map(player =>
                  <tr
                    className={player === props.currentUser ? 'highlight-current-user' : 'highlight-friend'}
                    id={`preview-${player.userId}`}
                    key={`preview-${player.userId}`}
                  >
                    <td>{player.rank}</td>
                    <td>
                      <span className="name-cell">
                        <a
                          href={`https://speedrun.com/user/${player.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >{player.name}</a>
                        {player !== props.currentUser &&
                          <FriendButton
                            isFriend={true}
                            playerId={player.userId}
                            onUnfriend={props.onUnfriend}
                            onBefriend={props.onBefriend}
                          />
                        }
                      </span>
                    </td>
                    <td>{player.score}</td>
                    <td>
                      <Button
                        variant="link"
                        onClick={() => props.currentUser && props.onJumpToPlayer(player.userId)}
                      >
                        <FontAwesomeIcon icon={faArrowAltCircleRight} />
                      </Button>
                    </td>
                  </tr>
                )
              : <>
                <tr className="highlight-current-user" id="preview-0"><td colSpan={4}></td></tr>
                <tr className="highlight-friend" id="preview-1"><td colSpan={4}></td></tr>
              </>
          }
        </tbody>
      </Table>
    </div>
  </>

export default QuickView
