import './Dashboard.css'
import { Alert, AlertProps, Col, Container, Row } from 'react-bootstrap'
import React, { useEffect, useState } from 'react'
import Player from '../models/Player'
import QuickView from './QuickView'
import Scoreboard from './Scoreboard'
import UpdateRunnerForm from './UpdateRunnerForm'
import { apiGet } from '../fetchers/api'

type DashboardProps = {
  currentUser: Player | null
}

const getFriends = () => apiGet('players/current/friends').then(res => res.json())

const Dashboard = (props: DashboardProps) => {

  useEffect(() => {
    if (!props.currentUser) return
    getFriends().then(setFriends)
  }, [props.currentUser])

  const players: Player[] = []
  for (let i = 0; i < 9; i++) {
    players.push(
      {
        rank: i + 1,
        name: `TestPlayer${i + 1}`,
        score: 111 * (9 - i),
        lastUpdate: new Date(),
        userId: `${i + 1}abc`,
      }
    )
  }

  const [alertVariant, setAlertVariant] = useState<AlertProps['variant']>('info')
  const [alertMessage, setAlertMessage] = useState('Building the DataTable. Please wait...')
  const [friends, setFriends] = useState<Player[]>([])

  const handleJumpToPlayer = (playerId: string) => console.log('handleJumpToPlayer', playerId)
  const handleOnUpdateRunner = (player: Player) => console.log('handleOnUpdateRunner', player)

  return <Container className="dashboard-container">
    <Alert variant={alertVariant}>{alertMessage}</Alert>

    <Row>
      <Col md={4}>
        <Row>
          <UpdateRunnerForm onUpdate={handleOnUpdateRunner} currentUser={props.currentUser} />
        </Row>

        <Row>
          <QuickView friends={friends} currentUser={props.currentUser} jumpToPlayer={handleJumpToPlayer} />
        </Row>
      </Col>

      <Col md={8}>
        <Scoreboard currentUser={props.currentUser} players={players} friends={friends} />
      </Col>
    </Row>
  </Container>
}

export default Dashboard
