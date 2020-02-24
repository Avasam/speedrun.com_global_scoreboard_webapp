import { Button, Col, Form, InputGroup, Modal } from 'react-bootstrap'
import React from 'react'
import SrcApiKeyLink from './SrcApiKeyLink'

type LoginModalProps = {
  show: boolean
  handleClose: () => void
}

const LoginModal = (props: LoginModalProps) =>
  <Modal show={props.show} onHide={props.handleClose}>
    <Modal.Header closeButton>
      <Modal.Title>Log in</Modal.Title>
    </Modal.Header>
    <Modal.Body>

      <Form>
        <Form.Group controlId="api-key">
          <Form.Label>Enter your API key</Form.Label>
          <InputGroup>
            <InputGroup.Prepend>
              <InputGroup.Text>@</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              type="text"
              placeholder="API key"
              aria-describedby="api key"
              required
            />
            {/* <Form.Control.Feedback type="invalid">
            Error message goes here
          </Form.Control.Feedback> */}
            <InputGroup.Append>
              <Button as="a" variant="outline-secondary" href="https://www.speedrun.com/api/auth" target="src">What&apos;s my key</Button>
            </InputGroup.Append>
          </InputGroup>
        </Form.Group>

        <Form.Group>
          <Col xs={{ span: 6, offset: 3 }}>
            <Button variant="success" block>Log in</Button>
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

export default LoginModal
