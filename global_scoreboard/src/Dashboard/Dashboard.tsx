import './Dashboard.css'
import { Alert, AlertProps, Col, Container, Row } from 'react-bootstrap'
import React, { useEffect, useRef, useState } from 'react'
import Scoreboard, { ScoreboardRef } from './Scoreboard'
import Player from '../models/Player'
import QuickView from './QuickView'
import UpdateRunnerForm from './UpdateRunnerForm'
import { apiGet } from '../fetchers/api'

type DashboardProps = {
  currentUser: Player | null
}

const getFriends = () => apiGet('players/current/friends').then(res => res.json())
const getAllPlayers = () => apiGet('players').then(res => res.json())

const Dashboard = (props: DashboardProps) => {

  useEffect(() => {
    // TODO: start both simultaneously, don't setPlayers until got both responses
    // TODO: Don't refetch players on login/logout
    getAllPlayers().then(setPlayers)
    if (!props.currentUser) return
    getFriends().then(setFriends)
  }, [props.currentUser])

  const [alertVariant, setAlertVariant] = useState<AlertProps['variant']>('info')
  const [alertMessage, setAlertMessage] = useState('Building the Scoreboard. Please wait...')
  const [friends, setFriends] = useState<Player[]>([])
  const [players, setPlayers] = useState<Player[]>([])

  const scoreboardRef = useRef<ScoreboardRef>(null)

  const handleJumpToPlayer = (playerId: string) => scoreboardRef.current?.jumpToPlayer(playerId)
  const handleOnUpdateRunner = (player: Player) => console.log('handleOnUpdateRunner', player)

  return <Container className="dashboard-container">
    <Alert variant={alertVariant}>{alertMessage}</Alert>

    <Row>
      <Col md={4}>
        <Row>
          <UpdateRunnerForm onUpdate={handleOnUpdateRunner} currentUser={props.currentUser} />
        </Row>

        <Row>
          <QuickView friends={friends} currentUser={props.currentUser} onJumpToPlayer={handleJumpToPlayer} />
        </Row>
      </Col>

      <Col md={8}>
        <Scoreboard currentUser={props.currentUser} players={players} friends={friends} ref={scoreboardRef} />
      </Col>
    </Row>
  </Container>
}

export default Dashboard
