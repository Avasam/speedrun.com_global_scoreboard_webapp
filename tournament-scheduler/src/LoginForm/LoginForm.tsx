import React, { useState } from 'react';
import { Button, TextField, Link, Container } from '@material-ui/core';

import SrcApiKeyLink from './SrcApiKeyLink'
import User from '../models/User';
import './LoginForm.css';

type loginFormProps = {
  setCurrentUser: (currentUser: User) => void
}

const LoginForm: React.FC<loginFormProps> = (props: loginFormProps) => {
  const [srcApiKeyInput, setSrcApiKeyInput] = useState('');

  const login = (srcApiKey: string) =>
    fetch(`${process.env.REACT_APP_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        srcApiKey,
      })
    }).then(res => res.json())
      .then((res: { token: string, user: User }) => {
        console.log(res)
        if (!res.token) return
        localStorage.setItem('jwtToken', res.token);
        props.setCurrentUser(res.user);
      })

  return <Container className='login-form-container'>
    <img src={`${process.env.REACT_APP_BASE_URL}/assets/images/favicon.ico`} alt='logo' />
    <div className='flex'>
      <TextField
        id='src-api-key'
        name='src-api-key'
        margin="normal"
        type='password'
        label='Enter your SRC API key'
        onChange={event => setSrcApiKeyInput(event.currentTarget.value)}
      />
      <Link
        href='https://www.speedrun.com/api/auth'
        target='src'
        rel='noreferrer'
      >What's my key?</Link>
    </div>
    <Button variant='contained' color='primary' onClick={() => login(srcApiKeyInput)}>Access my schedules</Button>
    <span className="paragraph">
      Don't trust the above link because SRC's api portal looks sketchy?
      <br />Fair enough, you can also access your api key through
      <br /> <SrcApiKeyLink></SrcApiKeyLink>
    </span>
    <label>Why do we need your API key?</label>
    <p>
      By using your key, it's possible to authenticate you to speedrun.com without ever asking for a password!
      <br />If something ever goes wrong or you believe someone is abusing your key, you can change it easily at any time.
      <br /> Once logged in, you can manage your schedules, which includes creating, modifying and sharing them!
    </p>
  </Container>
}

export default LoginForm;