import { Button, Modal } from 'react-bootstrap'
import React from 'react'

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

      <div className="form-group">
        <label htmlFor="api-key">Enter your API key</label>
        <div className="input-group">
          <span className="input-group-addon"><span className="glyphicon glyphicon-link"></span></span>
          <input type="text" name="api-key" id="api-key" className="form-control" placeholder="API key" required />
          <span className="input-group-btn">
            <a className="btn btn-default" href="https://www.speedrun.com/api/auth" target="src">What's my key?</a>
          </span>
        </div>
      </div>

      <div className="form-group">
        <div className="col-xs-6 col-xs-offset-3">
          <Button type="button" name="login-button" id="login-button" className="form-control btn btn-success">Log in</Button>
        </div>
      </div>

      <div className="form-group">
        <div className="col-xs-10 col-xs-offset-1">
          <div className="alert alert-info" id="loginResponseMessage" style={{ margin: '15px 0', visibility: 'hidden' }}></div>
        </div>
      </div>

      <br /><label>Why do we need your API key?</label>
      <br />By using your key, it&apos;s possible to authenticate you to speedrun.com without ever asking for a password! If something ever goes wrong or you believe someone is abusing your key, you can change it easily at any time.
      <br />Once logged in, you can update users and select others as friends. You&apos;ll also be able to find and compare yourself with your friends much more easily.
    </Modal.Body>
  </Modal>

export default LoginModal
