import './QuickView.css'

import { faArrowAltCircleRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Button, Table } from 'react-bootstrap'

import PlayerNameCell from 'src/Components/Dashboard/TableElements/PlayerNameCell'
import PlayerScoreCell from 'src/Components/Dashboard/TableElements/PlayerScoreCell'
import ScoreTitle from 'src/Components/Dashboard/TableElements/ScoreTitle'
import Configs from 'src/Models/Configs'
import type Player from 'src/Models/Player'
import { diffDays } from 'src/utils/Time'

const currentTimeOnLoad = new Date()
const columnClass = (lastUpdate: Date) => {
  const daysSince = diffDays(lastUpdate, currentTimeOnLoad)
  if (daysSince >= Configs.lastUpdatedDays[2]) return 'daysSince'
  if (daysSince >= Configs.lastUpdatedDays[1]) return 'daysSince2'
  return ''
}

export type QuickViewProps = {
  friends: Player[] | undefined
  currentUser: Player | null
  onJumpToPlayer: (playerId: string) => void
  onUnfriend: (playerId: string) => void
  onBefriend: (playerId: string) => void
}

const QuickView = (props: QuickViewProps) =>
  <Table responsive striped size='sm' className='quick-view'>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Name</th>
        <th><ScoreTitle /></th>
      </tr>
    </thead>
    <tbody>
      {
        props.currentUser && props.friends
          ? [...props.friends, props.currentUser]
            .sort((a, b) => b.score - a.score)
            .map(player => <tr
              className={player === props.currentUser ? 'highlight-current-user' : 'highlight-friend'}
              id={`preview-${player.userId}`}
              key={`preview-${player.userId}`}
            >
              <td className={columnClass(player.lastUpdate)}>{player.rank}</td>
              <td>
                <PlayerNameCell
                  player={player}
                  isFriend={true}
                  isCurrentUser={player === props.currentUser}
                  handleOnUnfriend={props.onUnfriend}
                  handleOnBefriend={props.onUnfriend}
                />
              </td>
              <td>
                <PlayerScoreCell player={player} />
                <Button
                  variant='link'
                  onClick={() => props.currentUser && props.onJumpToPlayer(player.userId)}
                >
                  <FontAwesomeIcon icon={faArrowAltCircleRight} />
                </Button>
              </td>
            </tr>)
          : <>
            <tr className='highlight-current-user' id='preview-0'><td colSpan={3}></td></tr>
            <tr className='highlight-friend' id='preview-1'><td colSpan={3}></td></tr>
          </>
      }
    </tbody>
  </Table>

export default QuickView
