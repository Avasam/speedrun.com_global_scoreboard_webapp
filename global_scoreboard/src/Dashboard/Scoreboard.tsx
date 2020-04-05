import FriendButton from './FriendButton'
import Player from '../models/Player'
import React from 'react'
import { Table } from 'react-bootstrap'

type ScoreboardProps = {
  currentUser: Player | null
  players: Player[]
  friends: Player[]
}

const Scoreboard = (props: ScoreboardProps) => {
  return <>
    <label>Scoreboard:</label>
    <Table bordered striped responsive>
      <thead>
        <tr>
          <th className="col-xs-1">Rank</th>
          <th className="col-xs-6">Name</th>
          <th className="col-xs-1">Score</th>
          <th className="col-xs-3">Last Updated</th>
          <th className="col-xs-1">ID</th>
        </tr>
      </thead>
      <tbody>
        {
          props.players.map(player => {
            let colorClass = ''
            if (player.userId === props.currentUser?.userId) {
              colorClass += ' highlight-current-user'
            }
            if (props.friends.some(friend => player.userId === friend.userId)) {
              colorClass += ' highlight-friend'
            }
            if (player.userId === 'kjp4y75j') {
              colorClass += ' highlight-vip'
            }

            return <tr
              className={colorClass}
              id={`player-${player.userId}`}
              key={`player-${player.userId}`}
            >
              <td>{player.rank}</td>
              <td>
                <a
                  href={`https://www.speedrun.com/user/${player.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >{player.name}</a>
                {props.currentUser?.userId !== player.userId &&
                  <FriendButton
                    isFriend={props.friends.some(friend => friend.userId === player.userId)}
                    playerId={player.userId}
                  />
                }
              </td>
              <td>{player.score}</td>
              <td>{player.lastUpdate.toISOString().slice(0, 16).replace('T', ' ')}</td>
              <td>{player.userId}</td>
            </tr>
          })
        }
      </tbody>
    </Table>
  </>
}

export default Scoreboard
