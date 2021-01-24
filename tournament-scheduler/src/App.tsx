import './App.css'

import { AppBar, Button, createMuiTheme, IconButton, ThemeProvider, Toolbar, Typography } from '@material-ui/core'
import { teal } from '@material-ui/core/colors'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { StatusCodes } from 'http-status-codes'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import Div100vh from 'react-div-100vh'

import { apiGet } from './fetchers/Api'
import LoginForm from './LoginForm/LoginForm'
import type User from './models/User'
import ScheduleManagement from './ScheduleManagement/ScheduleManagement'
import ScheduleRegistration from './ScheduleRegistration/ScheduleRegistration'
import ScheduleViewer from './ScheduleViewer/ScheduleViewer'

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
    primary: teal,
  },
})

const getCurrentUser = () => apiGet('users/current').then(res => res.json())

const logout = (setCurrentUser: (user: null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App: FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null | undefined>()
  const viewScheduleIdFromUrl = new URLSearchParams(window.location.search).get('view')
  const [viewScheduleId] = useState<number | null>((viewScheduleIdFromUrl && Number.parseInt(viewScheduleIdFromUrl)) || null)

  // Take registrationLink from the URL if present,
  // otherwise from the localStorage if there are no other searchParam
  const [scheduleRegistrationLink] = useState<string | null>(
    new URLSearchParams(window.location.search).get('register') ??
    (window.location.search
      ? null
      : localStorage.getItem('register'))
  )

  // Keep the registrationLink in localStorage to simulate staying on the same page when reloading the registration page
  // despite clearing up the URL
  if (scheduleRegistrationLink) {
    localStorage.setItem('register', scheduleRegistrationLink)
    window.history.pushState(null, document.title, window.location.href.replace(window.location.search, ''))
  } else {
    localStorage.removeItem('register')
  }

  useEffect(() => {
    getCurrentUser()
      .then((res: { user: User | undefined }) => res.user)
      .then(setCurrentUser)
      .catch((err: Response) => {
        if (err.status === StatusCodes.UNAUTHORIZED) {
          setCurrentUser(null)
        } else {
          console.error(err)
        }
      })
  }, [])

  const isMobileSize = useMediaQuery('(max-width:640px)')

  return <Div100vh className='App'>
    <ThemeProvider theme={darkTheme}>
      <AppBar position='static'>
        <Toolbar>
          {(currentUser || scheduleRegistrationLink || viewScheduleId || isMobileSize) &&
            <IconButton
              className='logo-button'
              onClick={() => {
                localStorage.removeItem('register')
                window.location.href = window.location.pathname
              }}
            >
              <img
                className='logo'
                style={{ height: !currentUser && isMobileSize ? 'auto' : undefined }}
                alt='logo'
                src={`${window.process.env.REACT_APP_BASE_URL}/assets/images/favicon.webp`}
              />
            </IconButton>
          }
          <Typography variant={currentUser || isMobileSize ? 'h4' : 'h2'}>Tournament Scheduler</Typography>
          {currentUser &&
            <Button variant='contained' color='secondary' onClick={() => logout(setCurrentUser)}>Logout</Button>
          }
        </Toolbar>
      </AppBar>

      <div className='main'>
        {scheduleRegistrationLink
          ? <ScheduleRegistration registrationLink={scheduleRegistrationLink} />
          : viewScheduleId
            ? <ScheduleViewer scheduleId={viewScheduleId} />
            : currentUser !== undefined && (currentUser
              ? <ScheduleManagement currentUser={currentUser} />
              : <LoginForm onLogin={setCurrentUser} />)
        }
      </div>

      <footer>
        &copy; <a href='https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/master/LICENSE' target='about'>Copyright</a> {new Date().getFullYear()} by <a href='https://github.com/Avasam/' target='about'>Samuel Therrien</a>.
        Powered by <a href='https://www.speedrun.com/' target='src'>speedrun.com</a> and <a href='https://www.pythonanywhere.com/' target='about'>PythonAnywhere</a>
      </footer>
    </ThemeProvider>
  </Div100vh>
}

export default App
