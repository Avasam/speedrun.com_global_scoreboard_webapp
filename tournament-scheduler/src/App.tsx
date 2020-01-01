import React, { useState, useEffect } from 'react'
import LoginForm from './LoginForm/LoginForm'
import ScheduleManagement from './ScheduleManagement/ScheduleManagement'
import ScheduleRegistration from './ScheduleRegistration/ScheduleRegistration'
import User from './models/User'

import './App.css'
import { Button, AppBar, Toolbar, Typography, IconButton } from '@material-ui/core'

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
  setCurrentUser(undefined);
  localStorage.removeItem('jwtToken');
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [scheduleRegistrationLink] = useState<string | null>(new URLSearchParams(window.location.search).get('register'))
  window.history.pushState(null, document.title, window.location.href.replace(window.location.search, ""));

  useEffect(() => {
    getCurrentUser()
      .then((res: { user: User | undefined }) => res.user)
      .then(setCurrentUser)
  }, [])

  return <div className='App'>
    <AppBar position="static">
      <Toolbar>
        {currentUser || scheduleRegistrationLink
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
        : currentUser
          ? <ScheduleManagement currentUser={currentUser}></ScheduleManagement>
          : <LoginForm setCurrentUser={(currentUser: User) => setCurrentUser(currentUser)}></LoginForm>
      }
    </div>

  </div>
}

export default App
