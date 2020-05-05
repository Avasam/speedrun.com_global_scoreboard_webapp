import { BsPrefixProps, ReplaceProps } from 'react-bootstrap/helpers'
import { Button, Col, Form, FormControlProps, InputGroup, Modal } from 'react-bootstrap'
import React, { FormEvent, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Player from '../models/Player'
import SrcApiKeyLink from './SrcApiKeyLink'
import { apiPost } from '../fetchers/api'
import { faLink } from '@fortawesome/free-solid-svg-icons'

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
      return setLoginErrorMessage('You must specify an API key to log in! ' +
        '\nClick "What\'s my key?" or fill in the interactive link below to find your key.')
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
        if (err.status === 401) {
          setLoginErrorMessage('Invalid SRC API key')
        } else {
          setLoginErrorMessage('Unknown error')
          console.error(err)
        }
      })
  }

  const handleSrcApiKeyChange = (event: FormEvent<ReplaceProps<'input', BsPrefixProps<'input'> & FormControlProps>>) =>
    setSrcApiKeyInput(event.currentTarget.value || '')

  return (
    <Modal show={props.show} onHide={props.onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Log in</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <Form>
          <Form.Group controlId="src-api-key">
            <Form.Label>Enter your API key</Form.Label>
            <InputGroup>
              <InputGroup.Prepend>
                <InputGroup.Text><FontAwesomeIcon icon={faLink} /></InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="password"
                placeholder="API key"
                aria-describedby="api key"
                required
                onChange={handleSrcApiKeyChange}
                isInvalid={!!loginErrorMessage}
              />
              <InputGroup.Append>
                <Button
                  as="a"
                  variant="outline-secondary"
                  href="https://www.speedrun.com/api/auth"
                  target="src"
                >What&apos;s my key?</Button>
              </InputGroup.Append>
              <Form.Control.Feedback type="invalid">
                {loginErrorMessage}
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>

          <Form.Group>
            <Col xs={{ span: 6, offset: 3 }}>
              <Button variant="success" block onClick={() => attemptLogin()}>Log in</Button>
            </Col>
          </Form.Group>

          <Form.Group>
            <span className="paragraph">
              If you don&apos;t trust the above link because SRC&apos;s api portal
              looks sketchy, you can also access your api key through:
              <SrcApiKeyLink />
            </span>
          </Form.Group>
        </Form>

        <br /><label>Why do we need your API key?</label>
        <br />By using your key, it&apos;s possible to authenticate you to
        speedrun.com without ever asking for a password! If something ever goes
        wrong or you believe someone is abusing your key, you can change it easily
        at any time.
        <br />Once logged in, you can update users and select others as friends.
        You&apos;ll also be able to find and compare yourself with your friends
        much more easily.
      </Modal.Body>
    </Modal>
  )
}

export default LoginModal
