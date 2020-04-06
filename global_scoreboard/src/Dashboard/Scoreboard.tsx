import 'react-bootstrap-table2-paginator/dist/react-bootstrap-table2-paginator.min.css'
import BootstrapTable from 'react-bootstrap-table-next'
import FriendButton from './FriendButton'
import Player from '../models/Player'
import React from 'react'
import { Table } from 'react-bootstrap'
import paginationFactory from 'react-bootstrap-table2-paginator'

const columns = [
  {
    dataField: 'rank',
    text: 'Rank',
  },
  {
    dataField: 'name',
    text: 'Name',
  },
  {
    dataField: 'score',
    text: 'Score',
  },
  {
    dataField: 'lastUpdate',
    text: 'Last Updated',
  },
  {
    dataField: 'userId',
    text: 'ID',
  },
]

const rowClasses = (row: Player, currentUser: Player | null, friends: Player[]) => {
  let colorClass = ''
  if (row.userId === currentUser?.userId) {
    colorClass += ' highlight-current-user'
  }
  if (friends.some(friend => row.userId === friend.userId)) {
    colorClass += ' highlight-friend'
  }
  if (row.userId === 'kjp4y75j') {
    colorClass += ' highlight-vip'
  }
  return colorClass
}

type ScoreboardProps = {
  currentUser: Player | null
  players: Player[]
  friends: Player[]
}

const Scoreboard = (props: ScoreboardProps) => {
  const players = props.players.map(player => ({
    ...player,
    lastUpdate: new Date(player.lastUpdate).toISOString().slice(0, 16).replace('T', ' '),
  }))
  return <>
    <label>Scoreboard:</label>
    <BootstrapTable
      keyField='userId'
      data={players}
      columns={columns}
      pagination={paginationFactory()}
      rowClasses={(row: Player) => rowClasses(row, props.currentUser, props.friends)}
    />

    {false &&
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
            players.map(player => {
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
                <td>{player.lastUpdate}</td>
                <td>{player.userId}</td>
              </tr>
            })
          }
        </tbody>
      </Table>
    }
  </>
}

export default Scoreboard
