import './App.css'
import { AppBar, Button, IconButton, ThemeProvider, Toolbar, Typography, createMuiTheme } from '@material-ui/core'
import React, { FC, useEffect, useState } from 'react'
import LoginForm from './LoginForm/LoginForm'
import ScheduleManagement from './ScheduleManagement/ScheduleManagement'
import ScheduleRegistration from './ScheduleRegistration/ScheduleRegistration'
import ScheduleViewer from './ScheduleViewer/ScheduleViewer'
import User from './models/User'

const darkTheme = createMuiTheme({
  palette: {
    type: 'dark',
  },
})

const getCurrentUser = () =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/users/current`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
  })
    .then(res => res.status >= 400 && res.status < 600
      ? Promise.reject(res)
      : res)
    .then(res => res.json())


const logout = (setCurrentUser: (user: User | undefined | null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App: FC = () => {
  const [currentUser, setCurrentUser] = useState<User | undefined | null>(undefined)
  const viewScheduleIdFromUrl = new URLSearchParams(window.location.search).get('view')
  const [viewScheduleId] = useState<number | null>((viewScheduleIdFromUrl && parseInt(viewScheduleIdFromUrl)) || null)

  // If a registrationLink wasn't in the URL, take the one from localStorage
  const [scheduleRegistrationLink] = useState<string | null>(
    new URLSearchParams(window.location.search).get('register') ||
    localStorage.getItem('register'))
  // Otherwise, clear up the localStorage
  if (window.location.search) {
    localStorage.removeItem('register')
  }
  // Keep the registrationLink in localStorage to simulate staying on the same page when reloading the registration page
  // despite clearing up the URL
  if (scheduleRegistrationLink) {
    localStorage.setItem('register', scheduleRegistrationLink)
    window.history.pushState(null, document.title, window.location.href.replace(window.location.search, ''))
  }

  useEffect(() => {
    getCurrentUser()
      .then((res: { user: User | undefined }) => res.user)
      .then(setCurrentUser)
      .catch(err => {
        if (err.status === 401) {
          setCurrentUser(null)
        } else {
          console.error(err)
        }
      })
  }, [])

  return <div className='App'>
    <ThemeProvider theme={darkTheme}>
      <AppBar position="static">
        <Toolbar>
          {currentUser || scheduleRegistrationLink || viewScheduleId
            ? <>
              <IconButton onClick={() => {
                localStorage.removeItem('register')
                window.location.href = window.location.pathname
              }}>
                <img
                  className='logo'
                  alt='logo'
                  src={`${window.process.env.REACT_APP_BASE_URL}/assets/images/favicon.ico`}
                />
              </IconButton>
              <Typography variant="h4">Tournament Scheduler</Typography>
              {currentUser &&
                <Button variant='contained' color='secondary' onClick={() => logout(setCurrentUser)}>Logout</Button>
              }
            </>
            : <Typography variant="h2">Tournament Scheduler</Typography>
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
              : <LoginForm setCurrentUser={(currentUser: User) => setCurrentUser(currentUser)} />)
        }
      </div>

      <footer>
        &copy; <a href="https://github.com/Avasam/speedrun.com_global_leaderboard_webapp/blob/master/LICENSE" target="about">Copyright</a> {new Date().getFullYear()} by <a href="https://github.com/Avasam/" target="about">Samuel Therrien</a>.
        Powered by <a href="https://www.speedrun.com/" target="src">speedrun.com</a> and <a href="https://www.pythonanywhere.com/" target="about">PythonAnywhere</a>
      </footer>
    </ThemeProvider>
  </div>
}

export default App
