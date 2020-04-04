import './App.css'
import 'bootstrap/dist/css/bootstrap.css'
import React, { FC } from 'react'
import Dashboard from './Dashboard/Dashboard'
import ScoreboardNavBar from './NavBar/ScoreboardNavBar'

const App: FC = () => {
  return (
    <div>
      <ScoreboardNavBar username={null} />

      <Dashboard />
      <footer>
        &copy; <a href="https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/master/LICENSE" target="about">Copyright</a> {new Date().getFullYear()} by <a href="https://github.com/Avasam/" target="about">Samuel Therrien</a>.
        Powered by <a href="https://www.speedrun.com/" target="src">speedrun.com</a> and <a href="https://www.pythonanywhere.com/" target="about">PythonAnywhere</a>
      </footer>
    </div>
  )
}

export default App
