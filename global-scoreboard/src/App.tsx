import './App.css'
import 'react-picky/dist/picky.css'
import 'bootstrap/dist/css/bootstrap.css'

import { StatusCodes } from 'http-status-codes'
import type { FC } from 'react'
import { StrictMode, useEffect, useState } from 'react'

import Dashboard from './Dashboard/Dashboard'
import { apiGet } from './fetchers/Api'
import GameSearch from './GameSearch/GameSearch'
import type { ServerConfigs } from './Models/Configs'
import Configs from './Models/Configs'
import type Player from './Models/Player'
import ScoreboardNavBar from './NavBar/ScoreboardNavBar'

const getCurrentUser = () => apiGet('users/current').then<{ user: Player | undefined }>(res => res.json())
const getConfigs = () => apiGet('configs').then<ServerConfigs>(res => res.json())

const logout = (setCurrentUser: (user: null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App: FC = () => {
  const [currentUser, setCurrentUser] = useState<Player | null | undefined>()

  useEffect(
    () =>
      void Promise
        .all([getConfigs(), getCurrentUser])
        .then(([serverConfigs, resPromise]) => {
          Configs.setConfigs(serverConfigs)
          resPromise()
            .then((res: { user: Player | undefined }) => res.user)
            .then(setCurrentUser)
            .catch((err: Response) => {
              if (err.status === StatusCodes.UNAUTHORIZED) {
                setCurrentUser(null)
              } else {
                console.error(err)
              }
            })
        }),
    []
  )

  return (
    <StrictMode>
      <ScoreboardNavBar
        username={currentUser === null ? null : currentUser?.name}
        onLogin={setCurrentUser}
        onLogout={() => logout(setCurrentUser)}
      />

      {window.location.pathname === '/global-scoreboard/game-search'
        ? <GameSearch />
        : <Dashboard currentUser={currentUser} />
      }
      <footer>
        &copy; <a
          href='https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/main/LICENSE'
          target='about'
        >Copyright</a> {new Date().getFullYear()} by <a
          href='https://github.com/Avasam/'
          target='about'
        >Samuel Therrien</a> (
        <a href='https://www.twitch.tv/Avasam' target='about'>
          Avasam<img
            height='14'
            alt='Twitch'
            src='https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png'
          ></img>
        </a>).
        Powered by <a
          href='https://www.speedrun.com/'
          target='src'
        >speedrun.com</a> and <a
          href='https://www.pythonanywhere.com/'
          target='about'
        >PythonAnywhere</a>
      </footer>
    </StrictMode>
  )
}

export default App
