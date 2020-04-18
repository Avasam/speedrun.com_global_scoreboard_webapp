import './Dashboard.css'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import React, { useEffect, useRef, useState } from 'react'
import Scoreboard, { ScoreboardRef } from './Scoreboard'
import { apiGet, apiPost } from '../fetchers/api'
import { AlertProps } from 'react-bootstrap/Alert'
import Player from '../models/Player'
import QuickView from './QuickView'
import UpdateRunnerForm from './UpdateRunnerForm'
import UpdateRunnerResult from '../models/UpdateRunnerResult'

type DashboardProps = {
  currentUser: Player | null | undefined
}

const getFriends = () => apiGet('players/current/friends').then<Player[]>(res => res.json())
const getAllPlayers = () => apiGet('players').then<Player[]>(res => res.json())

const Dashboard = (props: DashboardProps) => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(props.currentUser || null)
  const [friends, setFriends] = useState<Player[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [alertVariant, setAlertVariant] = useState<AlertProps['variant']>('info')
  const [alertMessage, setAlertMessage] = useState('Building the Scoreboard. Please wait...')

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
          setAlertMessage('')
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
        getAllPlayers().then(players => {
          setPlayers(players)
          setAlertMessage('')
        })
      }
    }
    // Note: I don't actually care about players dependency and don't want to rerun this code on players change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.currentUser])

  const scoreboardRef = useRef<ScoreboardRef>(null)

  const handleOnUpdateRunner = (runnerNameOrId: string) => {
    // TODO: Reimplement the loading bar
    setAlertVariant('info')
    setAlertMessage(`Updating "${runnerNameOrId}". This may take up to 5 mintues, depending on the amount of runs to analyse. Please Wait...`)
    apiPost(`players/${runnerNameOrId}/update`)
      .then<UpdateRunnerResult>(res => res.json())
      .then(result => {
        setAlertVariant(result.state)
        setAlertMessage(result.message)
        const newPlayers = [...players]
        const index = newPlayers.findIndex(player => player.userId === result.userId)
        if (index < 0) {
          // TODO: insert at the right row and navigate to it
          newPlayers.unshift({
            rank: result.rank, // TODO: infer rank by comparing scores
            name: result.name,
            countryCode: result.countryCode,
            score: result.score,
            lastUpdate: result.lastUpdate,
            userId: result.userId,
          })
        } else {
          // TODO: Navigate after inserting to it
          newPlayers[index] = {
            rank: result.rank, // TODO: infer new rank by comparing scores
            name: result.name,
            countryCode: result.countryCode,
            score: result.score,
            lastUpdate: result.lastUpdate,
            userId: players[index].userId,
          }
        }
        setPlayers(newPlayers)
        handleJumpToPlayer(result.userId)
      })
      .catch((err: Response | Error) => {
        setAlertVariant('danger')
        if (err instanceof Error) {
          setAlertMessage(`${err.name}: ${err.message}`)
        } else if (err.status === 504) {
          setAlertVariant('warning')
          setAlertMessage('Error 504. The webworker probably timed out, ' +
            'which can happen if updating takes more than 5 minutes. ' +
            'Please try again as next attempt should take less time since ' +
            'all calls to speedrun.com are cached for a day or until server restart.')
        } else {
          err.text().then(errorString => {
            try {
              const result: UpdateRunnerResult = JSON.parse(errorString)
              setAlertVariant(result.state || 'danger')
              setAlertMessage(result.message)
            } catch {
              setAlertMessage(errorString)
            }
          })
        }
      })
  }
  const handleJumpToPlayer = (playerId: string) => scoreboardRef.current?.jumpToPlayer(playerId)
  const handleUnfriend = (playerId: string) => setFriends(friends.filter(friend => friend.userId !== playerId))
  const handleBefriend = (playerId: string) => {
    const newFriend = players.find(player => player.userId === playerId)
    if (!newFriend) {
      return console.error(`Couldn't add friend id ${playerId} as it was not found in existing players table`)
    }
    setFriends([...friends, newFriend])
  }

  return <Container className="dashboard-container">
    <Alert variant="info">
      This version of the scoreboard <strong>is still in beta!</strong>{' '}
      If there&apos;s any bug or issue you&apos;d like to raise, you can do so{' '}
      <a href="https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/issues" target="about">over here</a>.
    </Alert>
    <Alert
      variant={alertVariant}
      style={{ visibility: alertMessage ? 'visible' : 'hidden' }}
    >
      {alertMessage || '&nbsp;'}
    </Alert>
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
