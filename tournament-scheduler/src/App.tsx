import React, { useState, useEffect } from 'react';
import LoginForm from './login-form/login-form';
import User from './models/User';

import './App.css';
import { Button } from '@material-ui/core';

const getCurrentUser = () =>
  fetch(`${process.env.REACT_APP_BASE_URL}/api/users/current`, {
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
    <img src={`${process.env.REACT_APP_BASE_URL}/assets/images/favicon.ico`} alt='logo' />

    {currentUser
      ? <>
        <div>This is where the user '{currentUser.name}' can see and edit their schedule forms</div>
        <Button variant='contained' color='secondary' onClick={() => logout(setCurrentUser)}>Logout</Button>
      </>
      : <LoginForm setCurrentUser={(currentUser: User) => setCurrentUser(currentUser)}></LoginForm>
    }


  </div>
}

export default App;
