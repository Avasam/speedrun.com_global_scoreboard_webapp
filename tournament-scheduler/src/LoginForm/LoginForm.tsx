import './LoginForm.css'
import { Button, Container, Link, TextField } from '@material-ui/core'
import React, { FC, useState } from 'react'
import SrcApiKeyLink from './SrcApiKeyLink'
import User from '../models/User'
import { apiPost } from '../fetchers/api'
import useMediaQuery from '@material-ui/core/useMediaQuery'

type loginFormProps = {
  onLogin: (currentUser: User) => void
}

const login = (srcApiKey: string, onLoginCallback: (currentUser: User) => void) =>
  apiPost('login', { srcApiKey })
    .then(res => res.json())
    .then((res: { token: string, user: User }) => {
      console.log(res)
      if (!res.token) return
      localStorage.setItem('jwtToken', res.token)
      onLoginCallback(res.user)
    })
    .catch(console.error)

const LoginForm: FC<loginFormProps> = (props: loginFormProps) => {
  const [srcApiKeyInput, setSrcApiKeyInput] = useState('')

  const isMobileSize = useMediaQuery('(max-width:640px)')

  return <Container className='login-form-container'>
    {!isMobileSize &&
      <img src={`${window.process.env.REACT_APP_BASE_URL}/assets/images/favicon.ico`} alt='logo' />
    }
    <span style={{ marginTop: '16px' }}>
      You only need to login to create and manage schedules.
      If you want to register to an existing schedule,
      ask the tournament organiser for a link.
    </span>
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
      >What&apos;s my key?</Link>
    </div>
    <Button
      variant='contained'
      color='primary'
      onClick={() => login(srcApiKeyInput, props.onLogin)}
    >Access my schedules</Button>
    <span className="paragraph">
      If you don&apos;t trust the above link because SRC&apos;s api portal looks sketchy, you can also access your api key through
      <br /> <SrcApiKeyLink></SrcApiKeyLink>
    </span>
    <label>Why do we need your API key?</label>
    <p>
      By using your key, it&apos;s possible to authenticate you to speedrun.com without ever asking for a password!
      <br />If something ever goes wrong or you believe someone is abusing your key, you can change it easily at any time.
      <br /> Once logged in, you can manage your schedules, which includes creating, modifying and sharing them!
      <br /><br />
    </p>
  </Container>
}

export default LoginForm
