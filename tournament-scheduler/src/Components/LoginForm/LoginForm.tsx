import { Button, Container, Link, Stack, TextField, Typography } from '@material-ui/core'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { useState } from 'react'

import SrcApiKeyLink from './SrcApiKeyLink'
import { apiPost } from 'src/fetchers/Api'
import type User from 'src/Models/User'

type loginFormProps = {
  onLogin: (currentUser: User) => void
}

const login = (srcApiKey: string, onLoginCallback: (currentUser: User) => void) =>
  apiPost('login', { srcApiKey })
    .then(res => res.json())
    .then((res: { token: string, user: User }) => {
      if (!res.token) return
      localStorage.setItem('jwtToken', res.token)
      onLoginCallback(res.user)
    })
    .catch(console.error)

const LoginForm = (props: loginFormProps) => {
  const [srcApiKeyInput, setSrcApiKeyInput] = useState('')

  const isMobileSize = useMediaQuery('(max-width:640px)')

  return <Container maxWidth='md'>
    <Stack alignItems='center' spacing={2}>
      {!isMobileSize &&
        <img
          style={{
            minHeight: 0,
            objectFit: 'contain',
            marginTop: 'auto',
          }}
          src={`${window.location.origin}/assets/images/favicon.webp`}
          alt='logo'
        />
      }
      <p>
        You only need to login to create and manage schedules.
        <br />
        If you want to register to an existing schedule,
        ask the tournament organiser for a link.
      </p>
      <Stack direction='row' alignItems='baseline' display='inline-flex' style={{ marginTop: 0 }}>
        <TextField
          size='small'
          name='src-api-key'
          type='password'
          label='Enter your SRC API key'
          onChange={event => setSrcApiKeyInput(event.currentTarget.value)}
        />
        <Link
          href='https://www.speedrun.com/api/auth'
          target='src'
          rel='noreferrer'
        >What&apos;s my key?</Link>
      </Stack>
      <Button
        variant='contained'
        onClick={() => login(srcApiKeyInput, props.onLogin)}
      >Access my schedules</Button>
      <p>
        If you don&apos;t trust the above link because SRC&apos;s api portal looks sketchy,
        you can also access your api key through
        <br /> <SrcApiKeyLink />
      </p>
      <Typography variant='h6'>Why do we need your API key?</Typography>
      <p style={{ marginBottom: 'auto' }}>
        By using your key, it&apos;s possible to authenticate you to speedrun.com without ever asking for a password!
        <br />
        If something ever goes wrong, or you believe someone is abusing your key, you can change it easily at any time.
        <br />
        Once logged in, you can manage your schedules, which includes creating, modifying and sharing them!
      </p>
    </Stack>
  </Container>
}

export default LoginForm
