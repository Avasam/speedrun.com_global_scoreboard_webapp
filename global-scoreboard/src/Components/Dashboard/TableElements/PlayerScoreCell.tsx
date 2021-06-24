import './PlayerScoreCell.css'

import { useState } from 'react'
import { Button } from 'react-bootstrap'

import { renderScoreTable } from 'src/Components/Dashboard/UpdateMessage'
import GenericModal from 'src/Components/GenericModal'
import { apiGet } from 'src/fetchers/Api'
import type Player from 'src/Models/Player'
import type { RunResult } from 'src/Models/UpdateRunnerResult'

type PlayerScoreCellProps = {
  player: Player
}

const PlayerScoreCell = (props: PlayerScoreCellProps) => {
  const [show, setShow] = useState(false)

  const handleClose = () => setShow(false)
  const handleShow = () =>
    props.player.scoreDetails === undefined
      ? apiGet(`players/${props.player.userId}/score-details`)
        .then(res =>
          res.json().then((scoreDetails: RunResult[][]) => {
            props.player.scoreDetails = scoreDetails
            setShow(true)
          }))
      : setShow(true)

  // Date is last known update date for a user with details
  return props.player.lastUpdate < new Date('2020-05-19')
    ? <span>{props.player.score}</span>
    : <>
      <Button
        variant='link'
        onClick={handleShow}
      >
        {props.player.score}
      </Button>
      <GenericModal
        show={show}
        onHide={handleClose}
        title={`Runner: ${props.player.name} (${props.player.userId}), ${props.player.score} pts`}
      >
        <div className='alert alert-success'>
          {props.player.scoreDetails
            ? renderScoreTable(props.player.scoreDetails)
            : 'No details available. ' +
            `You can update ${props.player.name} (${props.player.userId}) to get more details about their runs.`
          }
        </div>
      </GenericModal>
    </>
}

export default PlayerScoreCell
