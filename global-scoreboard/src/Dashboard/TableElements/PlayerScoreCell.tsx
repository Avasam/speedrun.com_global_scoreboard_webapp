
import './PlayerScoreCell.css'
import React, { useState } from 'react'
import { Button } from 'react-bootstrap'
import GenericModal from '../../GenericModal'
import Player from '../../models/Player'
import { apiGet } from '../../fetchers/api'

type PlayerScoreCellProps = {
  player: Player
}

const PlayerScoreCell = (props: PlayerScoreCellProps) => {
  const [show, setShow] = useState(false)

  const handleClose = () => setShow(false)
  const handleShow = () =>
    props.player.scoreDetails == null
      ? apiGet(`players/${props.player.userId}/score-details`)
        .then(res =>
          res.text().then(scoreDetails => {
            props.player.scoreDetails = scoreDetails
            setShow(true)
          })
        )
      : setShow(true)

  return !props.player.scoreDetails
    ? <span>{props.player.score}</span>
    : <>
      <Button
        variant="link"
        onClick={handleShow}
      >
        {props.player.score}
      </Button>
      <GenericModal
        show={show}
        onHide={handleClose}
        title={`Runner: ${props.player.name} (${props.player.userId}), ${props.player.score} pts`}
      >
        <div className="alert alert-success">
          {props.player.scoreDetails}
        </div>
      </GenericModal>
    </>
}

export default PlayerScoreCell
