import './App.css'
import 'bootstrap/dist/css/bootstrap.css'
import Configs, { ServerConfigs } from './models/Configs'
import React, { FC, useEffect, useState } from 'react'
import Dashboard from './Dashboard/Dashboard'
import Player from './models/Player'
import ScoreboardNavBar from './NavBar/ScoreboardNavBar'
import { apiGet } from './fetchers/api'

const getCurrentUser = () => apiGet('users/current').then<{ user: Player | undefined }>(res => res.json())
const getConfigs = () => apiGet('configs').then<ServerConfigs>(res => res.json())

const logout = (setCurrentUser: (user: null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App: FC = () => {
  const [currentUser, setCurrentUser] = useState<Player | undefined | null>(undefined)

  useEffect(() => {
    Promise
      .all([getConfigs(), getCurrentUser()])
      .then(([serverConfigs, res]) => {
        Configs.setConfigs(serverConfigs)
        setCurrentUser(res.user)
      })
      .catch(err => {
        if (err.status === 401) {
          setCurrentUser(null)
        } else {
          console.error(err)
        }
      })
  }, [])

  return (
    <div>
      <ScoreboardNavBar
        username={currentUser === null ? null : currentUser?.name}
        onLogin={setCurrentUser}
        onLogout={() => logout(setCurrentUser)}
      />

      <Dashboard currentUser={currentUser} />
      <footer>
        &copy; <a
          href="https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/master/LICENSE"
          target="about"
        >Copyright</a> {new Date().getFullYear()} by <a
          href="https://github.com/Avasam/"
          target="about"
        >Samuel Therrien</a>.
        Powered by <a
          href="https://www.speedrun.com/"
          target="src"
        >speedrun.com</a> and <a
          href="https://www.pythonanywhere.com/"
          target="about"
        >PythonAnywhere</a>
      </footer>
    </div>
  )
}

export default App
