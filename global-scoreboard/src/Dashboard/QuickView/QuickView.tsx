import './QuickView.css'
import { Button, Table } from 'react-bootstrap'
import Configs from '../../models/Configs'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Player from '../..//models/Player'
import PlayerNameCell from '../TableElements/PlayerNameCell'
import PlayerScoreCell from '../TableElements/PlayerScoreCell'
import React from 'react'
import ScoreTitle from '../TableElements/ScoreTitle'
import { faArrowAltCircleRight } from '@fortawesome/free-solid-svg-icons'

const currentTimeOnLoad = new Date()
const columnClass = (lastUpdate: Date) => {
  // TODO: This probably doesn't take daylight savings and other weird shenanigans into account
  const daysSince = Math.floor((currentTimeOnLoad.getTime() - lastUpdate.getTime()) / 86400000)
  if (daysSince >= Configs.lastUpdatedDays[2]) return 'daysSince'
  if (daysSince >= Configs.lastUpdatedDays[1]) return 'daysSince2'
  return ''
}

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
    <div className="table-responsive-lg quick-view">
      <Table striped>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th><ScoreTitle /></th>
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
                        variant="link"
                        onClick={() => props.currentUser && props.onJumpToPlayer(player.userId)}
                      >
                        <FontAwesomeIcon icon={faArrowAltCircleRight} />
                      </Button>
                    </td>
                  </tr>
                )
              : <>
                <tr className="highlight-current-user" id="preview-0"><td colSpan={3}></td></tr>
                <tr className="highlight-friend" id="preview-1"><td colSpan={3}></td></tr>
              </>
          }
        </tbody>
      </Table>
    </div>
  </>

export default QuickView
