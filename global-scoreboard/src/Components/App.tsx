import './App.css'

import { StatusCodes } from 'http-status-codes'
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import Dashboard from './Dashboard/Dashboard'
import GameSearch from './GameSearch/GameSearch'
import ScoreboardNavBar from './NavBar/ScoreboardNavBar'
import { apiGet } from 'src/fetchers/api'
import type { ServerConfigs } from 'src/Models/Configs'
import Configs from 'src/Models/Configs'
import type Player from 'src/Models/Player'

const getCurrentUser = () => apiGet('users/current').then<{ user: Player | undefined }>(response => response.json())
const getConfigs = () => apiGet('configs').then<ServerConfigs>(response => response.json())

const logout = (setCurrentUser: (user: null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App = () => {
  const [currentUser, setCurrentUser] = useState<Player | null | undefined>()

  useEffect(
    () =>
      void Promise
        .all([getConfigs(), getCurrentUser])
        .then(([serverConfigs, currentUserPromise]) => {
          Configs.setConfigs(serverConfigs)
          currentUserPromise()
            .then((response: { user: Player | undefined }) => response.user)
            .then(setCurrentUser)
            .catch((error: Response) => {
              if (error.status === StatusCodes.UNAUTHORIZED) {
                setCurrentUser(null)
              } else {
                console.error(error)
              }
            })
        }),
    []
  )
  return <>
    <ScoreboardNavBar
      onLogin={setCurrentUser}
      onLogout={() => logout(setCurrentUser)}
      username={currentUser === null ? null : currentUser?.name}
    />

    <Routes>
      <Route element={<GameSearch />} path='/game-search' />
      <Route element={<Dashboard currentUser={currentUser} />} path='/' />
    </Routes>

    <footer>
      &copy;
      {' '}
      <a
        href='https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/main/LICENSE'
        target='about'
      >
        Copyright
      </a>
      {' '}
      {new Date().getFullYear()}
      {' '}
      by
      {' '}
      <a
        href='https://github.com/Avasam/'
        target='about'
      >
        Samuel Therrien
      </a>
      {' '}
      (
      <a href='https://www.twitch.tv/Avasam' target='about'>
        Avasam
        {/**/}
        <img
          alt='Twitch'
          height='14'
          src='https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png'
        />
      </a>
      {/**/}
      ).
      Powered by
      <a
        href='https://www.speedrun.com/'
        target='speedruncom'
      >
        speedrun.com
      </a>
      {' '}
      and
      <a
        href='https://www.pythonanywhere.com/'
        target='about'
      >
        PythonAnywhere
      </a>
    </footer>
  </>
}

export default App
