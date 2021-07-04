import './index.css'
import 'react-picky/dist/picky.css'
import 'bootstrap/dist/css/bootstrap.css'

import { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'

import App from './Components/App'
import * as serviceWorker from './serviceWorker'
import ThemeProvider from 'src/Components/ThemeProvider'

ReactDOM.render(
  // Setup static Providers here
  <StrictMode>
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
