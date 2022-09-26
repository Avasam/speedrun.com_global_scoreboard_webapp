import { faLink } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { StatusCodes } from 'http-status-codes'
import type { ChangeEventHandler, FormEvent } from 'react'
import { useState } from 'react'
import { Button, Col, Form, InputGroup } from 'react-bootstrap'

import SpeedruncomApiKeyLink from './SpeedruncomApiKeyLink'
import GenericModal from 'src/Components/GenericModal'
import { apiPost } from 'src/fetchers/api'
import type Player from 'src/Models/Player'
import type UpdateRunnerResult from 'src/Models/UpdateRunnerResult'

type LoginModalProps = {
  show: boolean
  onClose: () => void
  onLogin: (currentUser: Player) => void
}

const LoginModal = (props: LoginModalProps) => {
  const [loading, setLoading] = useState(false)
  const [speedruncomApiKeyInput, setSpeedruncomApiKeyInput] = useState('')
  const [loginErrorMessage, setLoginErrorMessage] = useState('')

  const attemptLogin = () => {
    if (!speedruncomApiKeyInput) {
      setLoginErrorMessage('You must specify an API key to log in! ' +
        '\nClick "What\'s my key?" or fill in the interactive link below to find your key.')
      return
    }
    setLoading(true)
    setLoginErrorMessage('')
    apiPost<{ user: Player }>('login', { speedruncomApiKey: speedruncomApiKeyInput })
      .then(response => props.onLogin(response.user))
      .catch((error: unknown) => {
        if (error instanceof Response && error.status === StatusCodes.UNAUTHORIZED) {
          void error.json()
            .then((data: UpdateRunnerResult) => data.message ?? '')
            .then(setLoginErrorMessage)
        } else {
          setLoginErrorMessage('Something went wrong')
          console.error(error)
        }
      })
      .finally(() => setLoading(false))
  }

  const handleSpeedruncomApiKeyChange: ChangeEventHandler<HTMLInputElement> = event =>
    setSpeedruncomApiKeyInput(event.currentTarget.value)

  return (
    <GenericModal onHide={props.onClose} show={props.show} title='Enter your API key' >
      <Form onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}>
        <Form.Group className='mb-3'>
          <Form.Label>Enter your API key</Form.Label>
          <InputGroup>
            <InputGroup.Text><FontAwesomeIcon icon={faLink} /></InputGroup.Text>
            <Form.Control
              aria-describedby='api key'
              isInvalid={!!loginErrorMessage}
              name='speedruncom-api-key'
              onChange={handleSpeedruncomApiKeyChange}
              placeholder='API key'
              required
              type='password'
            />
            <Button
              as='a'
              href='https://www.speedrun.com/api/auth'
              target='speedruncom'
              variant='outline-secondary'
            >
              What&apos;s my key?
            </Button>
          </InputGroup>
          <Form.Control.Feedback type='invalid'>
            {loginErrorMessage}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className='mb-3'>
          <Col className='d-grid' xs={{ span: 6, offset: 3 }}>
            <Button disabled={loading} onClick={attemptLogin} type='submit' variant='success'>Log in</Button>
          </Col>
        </Form.Group>

        <Form.Group className='mb-3'>
          <p>
            If you don&apos;t trust the above link because SR.C&apos;s api portal
            looks sketchy, you can also access your api key through:
            <SpeedruncomApiKeyLink />
          </p>
        </Form.Group>
      </Form>

      <br />
      <Form.Label>Why do we need your API key?</Form.Label>
      <br />
      By using your key, it&apos;s possible to authenticate you to
      speedrun.com without ever asking for a password! If something ever goes
      wrong or you believe someone is abusing your key, you can change it easily
      at any time.
      <br />
      Once logged in, you can update users and select others as friends.
      You&apos;ll also be able to find and compare yourself with your friends
      much more easily.
    </GenericModal>
  )
}

export default LoginModal
