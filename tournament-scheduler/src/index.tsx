import './index.css'

import { StrictMode } from 'react'
import Div100vh from 'react-div-100vh'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import * as serviceWorker from './serviceWorker'

// Hack for local network testing
window.process = {
  env: process.env,
} as NodeJS.Process
if ((process.env.REACT_APP_BASE_URL?.includes('127.0.0.1') || process.env.REACT_APP_BASE_URL?.includes('localhost')) &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
) {
  window.process.env.REACT_APP_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000`
  console.info('REACT_APP_BASE_URL was changed ' +
    `from ${process.env.REACT_APP_BASE_URL} ` +
    `to ${window.process.env.REACT_APP_BASE_URL}`)
}

ReactDOM.render(
  <StrictMode>
    <BrowserRouter basename='/tournament-scheduler'>
      <Div100vh>
        <App />
      </Div100vh>
    </BrowserRouter>
  </StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
