import './Dashboard.css'
import { Col, Container, Row } from 'react-bootstrap'
import React, { useEffect, useRef, useState } from 'react'
import Scoreboard, { ScoreboardRef } from './Scoreboard'
import Player from '../models/Player'
import QuickView from './QuickView'
import UpdateRunnerForm from './UpdateRunnerForm'
import { apiGet } from '../fetchers/api'

type DashboardProps = {
  currentUser: Player | null | undefined
}

const getFriends = () => apiGet('players/current/friends').then<Player[]>(res => res.json())
const getAllPlayers = () => apiGet('players').then<Player[]>(res => res.json())

const Dashboard = (props: DashboardProps) => {

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(props.currentUser || null)
  const [friends, setFriends] = useState<Player[]>([])
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    // Note: Waiting to obtain both friends and players if both calls are needed
    // to set it all at once and avoid unneeded re-rerenders
    if (props.currentUser && players.length === 0) {
      Promise
        .all([getAllPlayers(), getFriends()])
        .then(([allPlayers, friends]) => {
          setCurrentPlayer(allPlayers.find(player => player.userId === props.currentUser?.userId) || null)
          setFriends(friends.map(friend => {
            const existingPlayer = allPlayers.find(player => player.userId === friend.userId)
            return {
              ...friend,
              rank: existingPlayer?.rank || 0,
              score: existingPlayer?.score || 0,
            }
          }))
          setPlayers(allPlayers)
        })
    } else if (props.currentUser && players.length > 0) {
      setCurrentPlayer(players.find(player => player.userId === props.currentUser?.userId) || null)
      getFriends().then(friends => setFriends(
        friends.map(friend => {
          const existingPlayer = players.find(player => player.userId === friend.userId)
          return {
            ...friend,
            rank: existingPlayer?.rank || 0,
            score: existingPlayer?.score || 0,
          }
        })
      ))
    } else {
      setCurrentPlayer(null)
      setFriends([])
      // Note: Loading the page already logged in starts the currentUser at undefined then quickly changes again
      // Also don't re-fetch players upon login out
      if (props.currentUser !== undefined && players.length === 0) {
        getAllPlayers().then(setPlayers)
      }
    }
    // Note: I don't actually care about players dependency and don't want to rerun this code on players change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.currentUser])

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
    <Row>
      <Col md={4}>
        <Row>
          <UpdateRunnerForm onUpdate={handleOnUpdateRunner} currentUser={currentPlayer} />
        </Row>

        <Row>
          <QuickView
            friends={friends}
            currentUser={currentPlayer}
            onJumpToPlayer={handleJumpToPlayer}
            onUnfriend={handleUnfriend}
            onBefriend={handleBefriend}
          />
        </Row>
      </Col>

      <Col md={8}>
        <Scoreboard
          ref={scoreboardRef}
          currentUser={currentPlayer}
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
