import React, { useEffect, useState } from 'react'
import { AppBar, Button, IconButton, Toolbar, Typography } from '@material-ui/core'

import './App.css'
import LoginForm from './LoginForm/LoginForm'
import ScheduleManagement from './ScheduleManagement/ScheduleManagement'
import ScheduleRegistration from './ScheduleRegistration/ScheduleRegistration'
import ScheduleViewer from './ScheduleViewer/ScheduleViewer'
import User from './models/User'


const getCurrentUser = () =>
  fetch(`${window.process.env.REACT_APP_BASE_URL}/api/users/current`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer: ${localStorage.getItem('jwtToken')}`,
    },
  }).then(res => res.json())


const logout = (setCurrentUser: (user: User | undefined) => void) => {
  setCurrentUser(undefined)
  localStorage.removeItem('jwtToken')
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined)
  const viewScheduleIdFromUrl = new URLSearchParams(window.location.search).get('view')
  const [viewScheduleId] = useState<number | null>((viewScheduleIdFromUrl && parseInt(viewScheduleIdFromUrl)) || null)
  const [scheduleRegistrationLink] = useState<string | null>(new URLSearchParams(window.location.search).get('register'))
  if (scheduleRegistrationLink) {
    window.history.pushState(null, document.title, window.location.href.replace(window.location.search, ''))
  }

  useEffect(() => {
    getCurrentUser()
      .then((res: { user: User | undefined }) => res.user)
      .then(setCurrentUser)
  }, [])

  return <div className='App'>
    <AppBar position="static">
      <Toolbar>
        {currentUser || scheduleRegistrationLink || viewScheduleId
          ? <>
            <IconButton>
              <img
                className='logo'
                alt='logo'
                src={`${window.process.env.REACT_APP_BASE_URL}/assets/images/favicon.ico`}
                onClick={() => window.location.href = window.location.pathname}
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
          : currentUser
            ? <ScheduleManagement currentUser={currentUser} />
            : <LoginForm setCurrentUser={(currentUser: User) => setCurrentUser(currentUser)} />
      }
    </div>

    <footer>
      &copy; <a href="https://github.com/Avasam/speedrun.com_global_leaderboard_webapp/blob/master/LICENSE" target="about">Copyright</a> {new Date().getFullYear()} by <a href="https://github.com/Avasam/" target="about">Samuel Therrien</a>.
      Powered by <a href="https://www.speedrun.com/" target="src">speedrun.com</a> and <a href="https://www.pythonanywhere.com/" target="about">PythonAnywhere</a>
    </footer>
  </div>
}

export default App
