import { faLink } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { StatusCodes } from 'http-status-codes'
import type { ChangeEventHandler, FormEvent } from 'react'
import { useState } from 'react'
import { Button, Col, Form, InputGroup } from 'react-bootstrap'

import SrcApiKeyLink from './SrcApiKeyLink'
import GenericModal from 'src/Components/GenericModal'
import { apiPost } from 'src/fetchers/Api'
import type Player from 'src/Models/Player'
import type UpdateRunnerResult from 'src/Models/UpdateRunnerResult'

type LoginModalProps = {
  show: boolean
  onClose: () => void
  onLogin: (currentUser: Player) => void
}

const LoginModal = (props: LoginModalProps) => {
  const [srcApiKeyInput, setSrcApiKeyInput] = useState('')
  const [loginErrorMessage, setLoginErrorMessage] = useState('')

  const attemptLogin = () => {
    if (!srcApiKeyInput) {
      setLoginErrorMessage('You must specify an API key to log in! ' +
        '\nClick "What\'s my key?" or fill in the interactive link below to find your key.')
      return
    }
    setLoginErrorMessage('')
    apiPost('login', { srcApiKey: srcApiKeyInput })
      .then(res => res.json())
      .then((res: { token: string, user: Player }) => {
        if (!res.token) return
        localStorage.setItem('jwtToken', res.token)
        props.onLogin(res.user)
      })
      .catch((err: Response) => {
        if (err.status === StatusCodes.UNAUTHORIZED) {
          void err.json()
            .then((data: UpdateRunnerResult) => data.message)
            .then(setLoginErrorMessage)
        } else {
          setLoginErrorMessage('Something went wrong')
          console.error(err)
        }
      })
  }

  const handleSrcApiKeyChange: ChangeEventHandler<HTMLInputElement> = event =>
    setSrcApiKeyInput(event.currentTarget.value)

  return (
    <GenericModal show={props.show} onHide={props.onClose} title='Enter your API key' >
      <Form onSubmit={(event: FormEvent<HTMLFormElement>) => event.preventDefault()}>
        <Form.Group className='mb-3'>
          <Form.Label>Enter your API key</Form.Label>
          <InputGroup>
            <InputGroup.Text><FontAwesomeIcon icon={faLink} /></InputGroup.Text>
            <Form.Control
              type='password'
              name='src-api-key'
              placeholder='API key'
              aria-describedby='api key'
              required
              onChange={handleSrcApiKeyChange}
              isInvalid={!!loginErrorMessage}
            />
            <Button
              as='a'
              variant='outline-secondary'
              href='https://www.speedrun.com/api/auth'
              target='src'
            >What&apos;s my key?</Button>
          </InputGroup>
          <Form.Control.Feedback type='invalid'>
            {loginErrorMessage}
          </Form.Control.Feedback>
        </Form.Group>

        <Form.Group className='mb-3'>
          <Col className='d-grid' xs={{ span: 6, offset: 3 }}>
            <Button type='submit' variant='success' onClick={() => attemptLogin()}>Log in</Button>
          </Col>
        </Form.Group>

        <Form.Group className='mb-3'>
          <p>
            If you don&apos;t trust the above link because SRC&apos;s api portal
            looks sketchy, you can also access your api key through:
            <SrcApiKeyLink />
          </p>
        </Form.Group>
      </Form>

      <br /><Form.Label>Why do we need your API key?</Form.Label>
      <br />By using your key, it&apos;s possible to authenticate you to
      speedrun.com without ever asking for a password! If something ever goes
      wrong or you believe someone is abusing your key, you can change it easily
      at any time.
      <br />Once logged in, you can update users and select others as friends.
      You&apos;ll also be able to find and compare yourself with your friends
      much more easily.
    </GenericModal>
  )
}

export default LoginModal
