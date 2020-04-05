import './Dashboard.css'
import { Alert, AlertProps, Col, Container, Row } from 'react-bootstrap'
import React, { FC, useState } from 'react'
import Player from '../models/Player'
import QuickView from './QuickView'
import Scoreboard from './Scoreboard'
import UpdateRunnerForm from './UpdateRunnerForm'

const Dashboard: FC = () => {
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
  const currentUser = players[0]
  const friends = [players[1], players[2], players[3]]

  const [alertVariant, setAlertVariant] = useState<AlertProps['variant']>('info')
  const [alertMessage, setAlertMessage] = useState('Building the DataTable. Please wait...')

  const handleJumpToPlayer = (playerId: string) => console.log('handleJumpToPlayer', playerId)
  const handleOnUpdateRunner = (player: Player) => console.log('handleOnUpdateRunner', player)

  return <Container className="dashboard-container">
    <Alert variant={alertVariant}>{alertMessage}</Alert>

    <Row>
      <Col md={4}>
        <Row>
          <UpdateRunnerForm onUpdate={handleOnUpdateRunner} currentUser={currentUser} />
        </Row>

        <Row>
          <QuickView friends={friends} currentUser={currentUser} jumpToPlayer={handleJumpToPlayer} />
        </Row>
      </Col>

      <Col md={8}>
        <Scoreboard currentUser={currentUser} players={players} friends={friends} />
      </Col>
    </Row>
  </Container>
}

export default Dashboard
