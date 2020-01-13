import React from 'react'
import logo from './logo.svg'
import './App.css'
import ScoreboardNavBar from './NavBar/ScoreboardNavBar'
import 'bootstrap/dist/css/bootstrap.css'

const App: React.FC = () => {
  return (
    <div className="App">
      <ScoreboardNavBar username={null}></ScoreboardNavBar>

      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
                </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
                </a>
      </header>
      <footer>
        &copy; <a href="https://github.com/Avasam/speedrun.com_global_leaderboard_webapp/blob/master/LICENSE" target="about">Copyright</a> {new Date().getFullYear()} by <a href="https://github.com/Avasam/" target="about">Samuel Therrien</a>.
        Powered by <a href="https://www.speedrun.com/" target="src">speedrun.com</a> and <a href="https://www.pythonanywhere.com/" target="about">PythonAnywhere</a>
      </footer>
    </div>
  )
}

export default App
