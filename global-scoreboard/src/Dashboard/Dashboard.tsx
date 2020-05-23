import './Dashboard.css'
import { Alert, Col, Container, ProgressBar, Row } from 'react-bootstrap'
import React, { useEffect, useRef, useState } from 'react'
import Scoreboard, { ScoreboardRef } from './Scoreboard'
import { apiDelete, apiGet, apiPost, apiPut } from '../fetchers/api'
import { AlertProps } from 'react-bootstrap/Alert'
import Configs from '../models/Configs'
import Player from '../models/Player'
import QuickView from './QuickView'
import UpdateRunnerForm from './UpdateRunnerForm'
import UpdateRunnerResult from '../models/UpdateRunnerResult'

type DashboardProps = {
  currentUser: Player | null | undefined
}

const progressBarTickInterval = 50
const minutes5 = 5 * 600
let progressTimer: NodeJS.Timeout

const getFriends = () => apiGet('players/current/friends').then<Player[]>(res => res.json())
const getAllPlayers = () => apiGet('players')
  .then<Player[]>(res => res.json())
  .then(players => {
    players.forEach(player => player.lastUpdate = new Date(player.lastUpdate))
    return players
  })

const validateRunnerNotRecentlyUpdated = (runnerNameOrId: string, players: Player[]) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return !players.some(player =>
    (player.name === runnerNameOrId || player.userId === runnerNameOrId) && player.lastUpdate >= yesterday
  )
}

const buildFriendsList = (friends: Player[], allPlayers: Player[]) =>
  friends.map(friend => {
    const friendPlayers = allPlayers.find(player => player.userId === friend.userId)
    return {
      ...friend,
      rank: friendPlayers?.rank,
      score: friendPlayers?.score,
    } as Player
  })

const inferRank = (players: Player[], score: number) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const lowerOrEqualPlayerFoundIndex = sortedPlayers.findIndex(player => player.score <= score)
  if (lowerOrEqualPlayerFoundIndex === 0) return 1

  const lowerOrEqualPlayerFound = sortedPlayers[lowerOrEqualPlayerFoundIndex]
  if (lowerOrEqualPlayerFound.rank == null) return undefined
  if (lowerOrEqualPlayerFound.score === score) return lowerOrEqualPlayerFound.rank
  return lowerOrEqualPlayerFoundIndex + .5
}

// Let's cheat! This is much simpler and more effective
const openLoginModal = () => document.getElementById('open-login-modal-button')?.click()

const Dashboard = (props: DashboardProps) => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(props.currentUser || null)
  const [friends, setFriends] = useState<Player[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [alertVariant, setAlertVariant] = useState<AlertProps['variant']>('info')
  const [alertMessage, setAlertMessage] = useState('Building the Scoreboard. Please wait...')
  const [progress, setProgress] = useState<number | null>(null)
  const startLoading = () => {
    setProgress(100)
    progressTimer = setInterval(
      () => setProgress(progress => progress && progress - (progressBarTickInterval / minutes5)),
      progressBarTickInterval)
  }
  const stopLoading = () => {
    setProgress(null)
    clearInterval(progressTimer)
  }

  useEffect(() => {
    // Note: Waiting to obtain both friends and players if both calls are needed
    // to set it all at once and avoid unneeded re-rerenders
    if (props.currentUser && players.length === 0) {
      Promise
        .all([getAllPlayers(), getFriends()])
        .then(([allPlayers, friends]) => {
          setCurrentPlayer(allPlayers.find(player => player.userId === props.currentUser?.userId) || null)
          setFriends(buildFriendsList(friends, allPlayers))
          setPlayers(allPlayers)
          setAlertMessage('')
        })
    } else if (props.currentUser && players.length > 0) {
      setCurrentPlayer(players.find(player => player.userId === props.currentUser?.userId) || null)
      getFriends().then(friends => setFriends(buildFriendsList(friends, players)))
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

    // Clear timer to prevent leaks
    return () => clearInterval(progressTimer)

    // Note: I don't actually care about players dependency and don't want to rerun this code on players change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.currentUser])

  const scoreboardRef = useRef<ScoreboardRef>(null)

  const handleOnUpdateRunner = (runnerNameOrId: string) => {
    setAlertVariant('info')
    setAlertMessage(`Updating "${runnerNameOrId}". This may take up to 5 mintues, depending on the amount of runs to analyse. Please Wait...`)
    if (window.process.env.REACT_APP_BYPASS_UPDATE_RESTRICTIONS !== 'true' &&
      !validateRunnerNotRecentlyUpdated(runnerNameOrId, players)) {
      setAlertVariant('warning')
      const cantUpdateTime = Configs.lastUpdatedDays[0]
      setAlertMessage(`Runner ${runnerNameOrId} has already been updated in the past ${cantUpdateTime} day${cantUpdateTime === 1 ? '' : 's'}`)
      return
    }
    startLoading()
    apiPost(`players/${runnerNameOrId}/update`)
      .then<UpdateRunnerResult>(res => res.json())
      .then(playerResult => {
        playerResult.lastUpdate = new Date(playerResult.lastUpdate)
        return playerResult
      })
      .then(result => {
        setAlertVariant(result.state)
        setAlertMessage(result.message)
        const newPlayers = [...players]
        const existingPlayerIndex = newPlayers.findIndex(player => player.userId === result.userId)
        const inferedRank = inferRank(newPlayers, result.score)
        const newPlayer = {
          rank: inferedRank,
          name: result.name,
          countryCode: result.countryCode,
          score: result.score,
          lastUpdate: result.lastUpdate,
        }
        if (existingPlayerIndex < 0) {
          newPlayers.push({
            ...newPlayer,
            userId: result.userId,
          })
        } else {
          newPlayers[existingPlayerIndex] = {
            ...newPlayer,
            userId: players[existingPlayerIndex].userId,
          }
        }

        setPlayers(newPlayers)
        if (friends.some(friend => friend.userId === result.userId)) {
          setFriends(buildFriendsList(friends, newPlayers))
        }
        if (currentPlayer?.userId === result.userId) {
          setCurrentPlayer({ ...currentPlayer, ...result, rank: inferedRank })
        }

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
        } else if (err.status === 409) {
          err.text().then(errorString => {
            setAlertVariant('warning')
            switch (errorString) {
              case 'current_user':
                setAlertMessage('It seems you are already updating a runner. Please try again in 5 minutes.')
                break
              case 'name_or_id':
                setAlertMessage('It seems that runner is already being updated (possibly by someone else). Please try again in 5 minutes.')
                break
              default:
                setAlertMessage(errorString)
            }
          })
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
      .finally(stopLoading)
  }

  const handleJumpToPlayer = (playerId: string) => scoreboardRef.current?.jumpToPlayer(playerId)
  const handleUnfriend = (playerId: string) =>
    apiDelete(`players/current/friends/${playerId}`)
      .then(() => setFriends(friends.filter(friend => friend.userId !== playerId)))
      .catch(console.error)
  const handleBefriend = (playerId: string) => {
    if (!currentPlayer) return openLoginModal()
    apiPut(`players/current/friends/${playerId}`)
      .then(() => {
        const newFriend = players.find(player => player.userId === playerId)
        if (!newFriend) {
          return console.error(`Couldn't add friend id ${playerId} as it was not found in existing players table`)
        }
        setFriends([...friends, newFriend])
      })
      .catch(console.error)
  }

  return <Container className="dashboard-container">
    <Alert variant="info">
      If there&apos;s any bug or issue you&apos;d like to raise, you can do so{' '}
      <a href="https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/issues" target="about">over here</a>.
    </Alert>
    <Alert
      variant={alertVariant}
      style={{ visibility: alertMessage ? 'visible' : 'hidden' }}
    >
      {alertMessage || '&nbsp;'}
      {progress != null && <ProgressBar animated variant="info" now={progress} />}
    </Alert>
    <Row>
      <Col md={4}>
        <Row>
          <UpdateRunnerForm
            onUpdate={handleOnUpdateRunner}
            updating={progress != null}
            currentUser={currentPlayer}
          />
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
