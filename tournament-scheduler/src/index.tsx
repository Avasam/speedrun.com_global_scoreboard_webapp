import '@culturehq/add-to-calendar/dist/styles.css'
import './index.css'

import { LocalizationProvider } from '@material-ui/lab'
import DateAdapter from '@material-ui/lab/AdapterDayjs'
import { StrictMode } from 'react'
import Div100vh from 'react-div-100vh'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import App from './Components/App'
import * as serviceWorker from './serviceWorker'

ReactDOM.render(
  // Setup static Providers here
  <StrictMode>
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Div100vh>
        <LocalizationProvider dateAdapter={DateAdapter}>
          <App />
        </LocalizationProvider>
      </Div100vh>
    </BrowserRouter>
  </StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
