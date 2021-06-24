import './App.css'
import 'react-picky/dist/picky.css'
import 'bootstrap/dist/css/bootstrap.css'

import { StatusCodes } from 'http-status-codes'
import { useEffect, useState } from 'react'
import { Route } from 'react-router-dom'

import Dashboard from './Dashboard/Dashboard'
import GameSearch from './GameSearch/GameSearch'
import ScoreboardNavBar from './NavBar/ScoreboardNavBar'
import { apiGet } from 'src/fetchers/Api'
import type { ServerConfigs } from 'src/Models/Configs'
import Configs from 'src/Models/Configs'
import type Player from 'src/Models/Player'

const getCurrentUser = () => apiGet('users/current').then<{ user: Player | undefined }>(res => res.json())
const getConfigs = () => apiGet('configs').then<ServerConfigs>(res => res.json())

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
  return <>
    <ScoreboardNavBar
      username={currentUser === null ? null : currentUser?.name}
      onLogin={setCurrentUser}
      onLogout={() => logout(setCurrentUser)}
    />

    <Route
      path='/'
      exact
      render={() => <Dashboard currentUser={currentUser} />}
    />
    <Route
      path='/game-search'
      component={GameSearch}
    />

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
  </>
}

export default App
