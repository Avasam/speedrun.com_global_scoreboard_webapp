import { Button, Container, Link, Stack, TextField, Typography } from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useState } from 'react'

import SpeedruncomApiKeyLink from './SpeedruncomApiKeyLink'
import { apiPost } from 'src/fetchers/api'
import type User from 'src/Models/User'

type loginFormProps = {
  onLogin: (currentUser: User) => void
}

const login = (speedruncomApiKey: string, onLoginCallback: (currentUser: User) => void) =>
  apiPost<{ user: User }>('login', { speedruncomApiKey })
    .then(response => onLoginCallback(response.user))
    .catch(console.error)

const LoginForm = (props: loginFormProps) => {
  const [speedruncomApiKeyInput, setSpeedruncomApiKeyInput] = useState('')

  const isMobileSize = useMediaQuery('(max-width:640px)')

  return <Container maxWidth='md'>
    <Stack alignItems='center' spacing={2}>
      {!isMobileSize &&
        <img
          alt='logo'
          src={`${window.location.origin}/assets/images/favicon.webp`}
          style={{
            minHeight: 0,
            objectFit: 'contain',
            marginTop: 'auto',
          }}
        />}
      <p>
        You only need to login to create and manage schedules.
        <br />
        If you want to register to an existing schedule,
        ask the tournament organiser for a link.
      </p>
      <Stack alignItems='baseline' direction='row' display='inline-flex' style={{ marginTop: 0 }}>
        <TextField
          label='Enter your SR.C API key'
          name='speedruncom-api-key'
          onChange={event => setSpeedruncomApiKeyInput(event.currentTarget.value)}
          size='small'
          type='password'
        />
        <Link
          href='https://www.speedrun.com/api/auth'
          rel='noreferrer'
          target='speedruncom'
        >
          What&apos;s my key?
        </Link>
      </Stack>
      <Button
        onClick={() => login(speedruncomApiKeyInput, props.onLogin)}
        variant='contained'
      >
        Access my schedules
      </Button>
      <p>
        If you don&apos;t trust the above link because SR.C&apos;s api portal looks sketchy,
        you can also access your api key through
        <br />
        {' '}
        <SpeedruncomApiKeyLink />
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
