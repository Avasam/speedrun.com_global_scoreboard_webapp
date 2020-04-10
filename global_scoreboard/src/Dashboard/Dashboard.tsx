import './Dashboard.css'
import { /*Alert, AlertProps,*/ Col, Container, Row } from 'react-bootstrap'
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
    // TODO: get friends score after fetching all players
    getAllPlayers().then(setPlayers)
    if (!props.currentUser) return
    getFriends().then(setFriends)
  }, [props.currentUser])

  // const [alertVariant, setAlertVariant] = useState<AlertProps['variant']>('info')
  // const [alertMessage, setAlertMessage] = useState('Building the Scoreboard. Please wait...')
  const [friends, setFriends] = useState<Player[]>([])
  const [players, setPlayers] = useState<Player[]>([])

  const scoreboardRef = useRef<ScoreboardRef>(null)

  const handleOnUpdateRunner = (player: Player) => console.log('handleOnUpdateRunner', player)
  const handleJumpToPlayer = (playerId: string) => scoreboardRef.current?.jumpToPlayer(playerId)
  const handleUnfriend = (playerId: string) => setFriends(friends.filter(friend => friend.userId !== playerId))
  const handleBefriend = (playerId: string) => {
    const newFriend = players.find(player => player.userId === playerId)
    if (!newFriend) return console.error(`Couldn't add friend id ${playerId} as it was not found in array of players`)
    setFriends([...friends, newFriend])
  }

  return <Container className="dashboard-container">
    {/* <Alert variant={alertVariant}>{alertMessage}</Alert> */}

    <Row>
      <Col md={4}>
        <Row>
          <UpdateRunnerForm onUpdate={handleOnUpdateRunner} currentUser={props.currentUser} />
        </Row>

        <Row>
          <QuickView
            friends={friends}
            currentUser={props.currentUser}
            onJumpToPlayer={handleJumpToPlayer}
            onUnfriend={handleUnfriend}
            onBefriend={handleBefriend}
          />
        </Row>
      </Col>

      <Col md={8}>
        <Scoreboard
          ref={scoreboardRef}
          currentUser={props.currentUser}
          players={players}
          friends={friends}
          onUnfriend={handleUnfriend}
          onBefriend={handleBefriend}
        />
      </Col>
    </Row>
  </Container>
}

export default Dashboard
