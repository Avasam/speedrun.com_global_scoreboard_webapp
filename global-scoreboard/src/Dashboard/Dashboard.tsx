import './Dashboard.css'

import { useEffect, useRef, useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { AlertProps } from 'react-bootstrap/Alert'

import { apiDelete, apiGet, apiPost, apiPut } from '../fetchers/Api'
import Configs from '../models/Configs'
import Player from '../models/Player'
import UpdateRunnerResult from '../models/UpdateRunnerResult'
import QuickView from './QuickView/QuickView'
import Scoreboard, { ScoreboardRef } from './Scoreboard'
import UpdateMessage, { renderScoreTable } from './UpdateMessage'
import UpdateRunnerForm from './UpdateRunnerForm'

type DashboardProps = {
  currentUser: Player | null | undefined
}

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
    (player.name === runnerNameOrId || player.userId === runnerNameOrId) && player.lastUpdate >= yesterday)
}

const buildFriendsList = (friends: Player[], allPlayers: Player[]) =>
  allPlayers.filter(player => friends.some(friend => player.userId === friend.userId))

const inferRank = (players: Player[], score: number) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const lowerOrEqualPlayerFoundIndex = sortedPlayers.findIndex(player => player.score <= score)
  if (lowerOrEqualPlayerFoundIndex === 0) return 1
  if (lowerOrEqualPlayerFoundIndex < 0) return players.length

  const lowerOrEqualPlayerFound = sortedPlayers[lowerOrEqualPlayerFoundIndex]
  return lowerOrEqualPlayerFound.score === score && lowerOrEqualPlayerFound.rank
    ? lowerOrEqualPlayerFound.rank
    : lowerOrEqualPlayerFoundIndex + 1
}

// Let's cheat! This is much simpler and more effective
const openLoginModal = () => document.getElementById('open-login-modal-button')?.click()

const Dashboard = (props: DashboardProps) => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(props.currentUser || null)
  const [friendsState, setFriendsState] = useState<Player[]>([])
  const [playersState, setPlayersState] = useState<Player[]>([])
  const [alertVariant, setAlertVariant] = useState<AlertProps['variant']>('info')
  const [alertMessage, setAlertMessage] = useState<JSX.Element | string>('Building the Scoreboard. Please wait...')
  const [updateStartTime, setUpdateStartTime] = useState<number | null>(null)

  useEffect(() => {
    // Note: Waiting to obtain both friends and players if both calls are needed
    // to set it all at once and avoid unneeded re-rerenders
    if (props.currentUser && playersState.length === 0) {
      Promise
        .all([getAllPlayers(), getFriends()])
        .then(([allPlayers, friends]) => {
          setCurrentPlayer(allPlayers.find(player => player.userId === props.currentUser?.userId) || null)
          setFriendsState(buildFriendsList(friends, allPlayers))
          setPlayersState(allPlayers)
          setAlertMessage('')
        })
    } else if (props.currentUser && playersState.length > 0) {
      setCurrentPlayer(playersState.find(player => player.userId === props.currentUser?.userId) || null)
      getFriends().then(friends => setFriendsState(buildFriendsList(friends, playersState)))
    } else {
      setCurrentPlayer(null)
      setFriendsState([])
      // Note: Loading the page already logged in starts the currentUser at undefined then quickly changes again
      // Also don't re-fetch players upon login out
      if (props.currentUser !== undefined && playersState.length === 0) {
        getAllPlayers().then(players => {
          setPlayersState(players)
          setAlertMessage('')
        })
      }
    }

    // Note: I don't actually care about players dependency and don't want to rerun this code on players change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.currentUser])

  const scoreboardRef = useRef<ScoreboardRef>(null)

  const handleOnUpdateRunner = (runnerNameOrId: string) => {
    setAlertVariant('info')
    setAlertMessage(`Updating "${runnerNameOrId}". This may take up to 5 minutes, depending on the amount of runs to analyse. Please Wait...`)
    if (window.process.env.REACT_APP_BYPASS_UPDATE_RESTRICTIONS !== 'true' &&
      !validateRunnerNotRecentlyUpdated(runnerNameOrId, playersState)) {
      setAlertVariant('warning')
      const cantUpdateTime = Configs.lastUpdatedDays[0]
      setAlertMessage(`Runner ${runnerNameOrId} has already been updated in the past ${cantUpdateTime} day${cantUpdateTime === 1 ? '' : 's'}`)
      return
    }
    setUpdateStartTime(Date.now())
    apiPost(`players/${runnerNameOrId}/update`)
      .then<UpdateRunnerResult>(res => res.json())
      .then(playerResult => {
        playerResult.lastUpdate = new Date(playerResult.lastUpdate)
        return playerResult
      })
      .then(result => {
        setAlertVariant(result.state)
        setAlertMessage(renderScoreTable(result.scoreDetails || [[], []], result.message))
        const newPlayers = [...playersState]
        const existingPlayerIndex = newPlayers.findIndex(player => player.userId === result.userId)
        const inferedRank = inferRank(newPlayers, result.score)
        const playerModifications = {
          rank: inferedRank,
          name: result.name,
          countryCode: result.countryCode,
          score: result.score,
          lastUpdate: result.lastUpdate,
        }
        if (existingPlayerIndex < 0) {
          newPlayers.push({
            ...playerModifications,
            userId: result.userId,
          })
        } else {
          newPlayers[existingPlayerIndex] = Object.assign(
            {
              userId: playersState[existingPlayerIndex].userId,
            },
            playerModifications
          )
        }

        setPlayersState(newPlayers)
        if (friendsState.some(friend => friend.userId === result.userId)) {
          setFriendsState(buildFriendsList(friendsState, newPlayers))
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
        } else if (err.status === 418) {
          setAlertVariant('warning')
          setAlertMessage(<div>
            <p>You know the drill...</p>
            <p>
              <img src='https://speedrun.com/themes/Default/1st.png' alt='' />
              <br />
              <img src='https://speedrun.com/themes/Default/logo.png' alt='speedrun.com' style={{ width: 384 }} />
            </p>
            <p>Oops! The site&apos;s under a lot of pressure right now. Please try again in a minute.</p>
            <img src='https://brand.twitch.tv/assets/emotes/lib/kappa.png' alt='Kappa' />
          </div>)
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
              if (err.status === 400 && result.score != null && result.score < 1) {
                setPlayersState(playersState.filter(player => player.userId !== result.userId))
              }
            } catch {
              setAlertMessage(errorString)
            }
          })
        }
      })
      .finally(() => setUpdateStartTime(null))
  }

  const handleJumpToPlayer = (playerId: string) => scoreboardRef.current?.jumpToPlayer(playerId)
  const handleUnfriend = (playerId: string) =>
    apiDelete(`players/current/friends/${playerId}`)
      .then(() => setFriendsState(friendsState.filter(friend => friend.userId !== playerId)))
      .catch(console.error)
  const handleBefriend = (playerId: string) => {
    if (!currentPlayer) return openLoginModal()
    apiPut(`players/current/friends/${playerId}`)
      .then(() => {
        const newFriend = playersState.find(player => player.userId === playerId)
        if (!newFriend) {
          return console.error(`Couldn't add friend id ${playerId} as it was not found in existing players table`)
        }
        setFriendsState([...friendsState, newFriend])
      })
      .catch(console.error)
  }

  return <Container className='dashboard-container'>
    <UpdateMessage
      variant={alertVariant}
      message={alertMessage}
      updateStartTime={updateStartTime}
    />
    <Row>
      <Col md={4}>
        <Row>
          <UpdateRunnerForm
            onUpdate={handleOnUpdateRunner}
            updating={updateStartTime != null}
            currentUser={currentPlayer}
          />
        </Row>

        <Row>
          <QuickView
            friends={friendsState}
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
          players={playersState}
          friends={friendsState}
          onUnfriend={handleUnfriend}
          onBefriend={handleBefriend}
        />
      </Col>
    </Row>
  </Container>
}

export default Dashboard
