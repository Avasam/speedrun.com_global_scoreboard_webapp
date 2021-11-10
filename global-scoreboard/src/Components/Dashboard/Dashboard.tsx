import './Dashboard.css'

import { ReasonPhrases, StatusCodes } from 'http-status-codes'
import { useEffect, useRef, useState } from 'react'
import { Container } from 'react-bootstrap'
import type { Variant } from 'react-bootstrap/esm/types'

import type { ScoreboardRef } from './Scoreboard'
import { DesktopScoreTableLayout, MobileScoreTableLayout } from './TableElements/ScoreTableLayout'
import UpdateMessage, { renderScoreTable } from './UpdateMessage'
import { apiDelete, apiGet, apiPost, apiPut } from 'src/fetchers/api'
import Configs from 'src/Models/Configs'
import type Player from 'src/Models/Player'
import type UpdateRunnerResult from 'src/Models/UpdateRunnerResult'
import math from 'src/utils/math'

type DashboardProps = {
  currentUser: Player | null | undefined
}

const MOBILE_SIZE = 767

const getFriends = () => apiGet('players/current/friends').then<Player[]>(response => response.json())
const getAllPlayers = () => apiGet('players')
  .then<Player[]>(response => response.json())
  .then(players =>
    players.map(player => ({
      ...player,
      lastUpdate: new Date(player.lastUpdate),
    })))

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
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(props.currentUser ?? null)
  const [friendsState, setFriendsState] = useState<Player[] | undefined>()
  const [playersState, setPlayersState] = useState<Player[]>([])
  const [alertVariant, setAlertVariant] = useState<Variant>('info')
  const [alertMessage, setAlertMessage] = useState<JSX.Element | string>('Building the Scoreboard. Please wait...')
  const [updateStartTime, setUpdateStartTime] = useState<number | null>(null)
  const [isMobileSize, setIsMobileSize] = useState(window.innerWidth <= MOBILE_SIZE)
  // TODO the following react SafeMode errors are thrown:
  /*
  Warning: Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code.
  See https://reactjs.org/link/unsafe-component-lifecycles for details.

  * Move data fetching code or side effects to componentDidUpdate.
  * If you're updating state whenever props change,
  * refactor your code to use memoization techniques or move it to static getDerivedStateFromProps.
  * Learn more at: https://reactjs.org/link/derived-state

  Please update the following components: DataProvider, SearchProvider, SortProvider
  */
  window.addEventListener('resize', () => {
    const newIsMobileSize = window.innerWidth <= MOBILE_SIZE
    if (newIsMobileSize === isMobileSize) return
    setIsMobileSize(newIsMobileSize)
  })

  useEffect(() => {
    // Note: Waiting to obtain both friends and players if both calls are needed
    // to set it all at once and avoid unneeded re-rerenders
    if (props.currentUser && playersState.length === 0) {
      void Promise
        .all([getAllPlayers(), getFriends()])
        .then(([allPlayers, friends]) => {
          setCurrentPlayer(allPlayers.find(player => player.userId === props.currentUser?.userId) ?? null)
          setFriendsState(buildFriendsList(friends, allPlayers))
          setPlayersState(allPlayers)
          setAlertMessage('')
        })
    } else if (props.currentUser && playersState.length > 0) {
      setCurrentPlayer(playersState.find(player => player.userId === props.currentUser?.userId) ?? null)
      void getFriends().then(friends => setFriendsState(buildFriendsList(friends, playersState)))
    } else {
      setCurrentPlayer(null)
      setFriendsState([])
      // Note: Loading the page already logged in starts the currentUser at undefined then quickly changes again
      // Also don't re-fetch players upon login out
      if (props.currentUser !== undefined && playersState.length === 0) {
        void getAllPlayers().then(players => {
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
    setAlertMessage(`Updating "${runnerNameOrId}". This may take up to 5 minutes, ` +
      'depending on the amount of runs to analyse. Please Wait...')
    if (process.env.REACT_APP_BYPASS_UPDATE_RESTRICTIONS !== 'true' &&
      !validateRunnerNotRecentlyUpdated(runnerNameOrId, playersState)) {
      setAlertVariant('warning')
      const cantUpdateTime = Configs.lastUpdatedDays[0]
      setAlertMessage(`Runner ${runnerNameOrId} has already been updated in the past ` +
        `${cantUpdateTime} day${cantUpdateTime === 1 ? '' : 's'}`)
      return
    }
    setUpdateStartTime(Date.now())
    apiPost(`players/${runnerNameOrId}/update`)
      .then<UpdateRunnerResult>(response => response.json())
      .then(playerResult => {
        playerResult.lastUpdate = new Date(playerResult.lastUpdate)
        return playerResult
      })
      .then(onUpdateRunnerThen)
      .catch(onUpdateRunnerCatch)
      .finally(() => setUpdateStartTime(null))
  }

  const onUpdateRunnerThen = (result: UpdateRunnerResult) => {
    setAlertVariant(result.state ?? 'warning')
    setAlertMessage(renderScoreTable(result.scoreDetails ?? [[], []], result.message))
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
    if (friendsState?.some(friend => friend.userId === result.userId)) {
      setFriendsState(buildFriendsList(friendsState, newPlayers))
    }
    if (currentPlayer?.userId === result.userId) {
      setCurrentPlayer({ ...currentPlayer, ...result, rank: inferedRank })
    }

    handleJumpToPlayer(result.userId)
  }

  const onUpdateRunnerCatch = (errorResponse: Error | Response) => {
    let temporaryAlertVariant = 'danger'
    if (errorResponse instanceof Error) {
      setAlertMessage(`${errorResponse.name}: ${errorResponse.message}`)
    } else {
      temporaryAlertVariant = 'warning'
      const conflictCase = (error: { messageKey: string, timeLeft: number }) => {
        const tryAgain = `Please try again in ${Math.ceil(error.timeLeft / math.SECONDS_IN_MINUTE)} minutes.`
        switch (error.messageKey) {
          case 'current_user':
            setAlertMessage(`It seems you are already updating a runner. ${tryAgain}`)
            break
          case 'name_or_id':
            setAlertMessage(`It seems this runner is already being updated (possibly by someone else). ${tryAgain}`)
            break
          default:
            setAlertMessage(`${error.messageKey} ${tryAgain}`)
        }
      }
      const defaultCase = (error: string) => {
        try {
          const result = JSON.parse(error) as UpdateRunnerResult
          setAlertVariant(result.state ?? 'danger')
          setAlertMessage(result.message ?? '')
          if (errorResponse.status === StatusCodes.BAD_REQUEST && result.score < 1) {
            setPlayersState(playersState.filter(player => player.userId !== result.userId))
          }
        } catch {
          setAlertVariant('danger')
          setAlertMessage(error)
        }
      }
      switch (errorResponse.status) {
        case StatusCodes.IM_A_TEAPOT:
          setAlertMessage(<div>
            <p>You know the drill...</p>
            <p>
              <img alt='SR.C logo' src='https://speedrun.com/themes/Default/1st.png' />
              <img alt='Kappa' height='64px' src='https://brand.twitch.tv/assets/emotes/lib/kappa.png' />
              <br />
              <img alt='speedrun.com' src='https://speedrun.com/themes/Default/logo.png' width='384px' />
            </p>
            <p>Oops! The site&apos;s under a lot of pressure right now. Please try again in a minute.</p>
          </div>)

          break
        case StatusCodes.GATEWAY_TIMEOUT:
          setAlertMessage(`Error ${StatusCodes.GATEWAY_TIMEOUT}: ${ReasonPhrases.GATEWAY_TIMEOUT}. ` +
            'The webworker probably timed out, which can happen if updating takes more than 5 minutes. ' +
            'Please try again as all calls to speedrun.com are cached for a day.')

          break
        case StatusCodes.CONFLICT:
          void errorResponse.json().then(conflictCase)
          break
        default:
          void errorResponse.text().then(defaultCase)
      }
    }
    setAlertVariant(temporaryAlertVariant)
  }

  const handleJumpToPlayer = (playerId: string) => scoreboardRef.current?.jumpToPlayer(playerId)
  const handleUnfriend = (playerId: string) =>
    apiDelete(`players/current/friends/${playerId}`)
      .then(() => setFriendsState(friendsState?.filter(friend => friend.userId !== playerId)))
      .catch(console.error)
  const handleBefriend = (playerId: string) => {
    if (!currentPlayer) return openLoginModal()
    apiPut(`players/current/friends/${playerId}`)
      .then(() => {
        const newFriend = playersState.find(player => player.userId === playerId)
        if (!newFriend) {
          console.error(`Couldn't add friend id ${playerId} as it was not found in existing players table`)
          return
        }
        setFriendsState([...friendsState ?? [], newFriend])
      })
      .catch(console.error)
  }

  const layoutProps = {
    onUpdate: handleOnUpdateRunner,
    onJumpToPlayer: handleJumpToPlayer,
    updating: updateStartTime != null,
    currentUser: currentPlayer,
    players: playersState,
    friends: friendsState,
    onUnfriend: handleUnfriend,
    onBefriend: handleBefriend,
    ref: scoreboardRef,
  }

  return <Container className='dashboard-container'>
    <UpdateMessage
      message={alertMessage}
      updateStartTime={updateStartTime}
      variant={alertVariant}
    />
    {isMobileSize && currentPlayer
      ? <MobileScoreTableLayout {...layoutProps} />
      : <DesktopScoreTableLayout {...layoutProps} />}
  </Container>
}

export default Dashboard
