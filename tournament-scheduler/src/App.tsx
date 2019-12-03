import React, { useState, useEffect } from 'react';
import LoginForm from './LoginForm/LoginForm';
import ScheduleManagement from './ScheduleManagement/ScheduleManagement';
import User from './models/User';

import './App.css';
import { Button, AppBar, Toolbar, Typography, IconButton } from '@material-ui/core';

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

  useEffect(() => {
    getCurrentUser()
      .then((res: { user: User | undefined }) => {
        console.log(res)
        setCurrentUser(res.user);
      })
  }, [])

  return <div className='App'>
    <AppBar position="static">
      <Toolbar>
        {currentUser
          ? <>
            <IconButton>
              <img className='logo' src={`${window.process.env.REACT_APP_BASE_URL}/assets/images/favicon.ico`} alt='logo' />
            </IconButton>
            <Typography variant="h4">Tournament Scheduler</Typography>
            <Button variant='contained' color='secondary' onClick={() => logout(setCurrentUser)}>Logout</Button>
          </>
          : <Typography variant="h2">Tournament Scheduler</Typography>}
      </Toolbar>
    </AppBar>

    <div className='main'>
      {currentUser
        ? <ScheduleManagement currentUser={currentUser}></ScheduleManagement>
        : <LoginForm setCurrentUser={(currentUser: User) => setCurrentUser(currentUser)}></LoginForm>
      }
    </div>

  </div>
}

export default App;
