import './ScoreboardNavBar.css'

import { useState } from 'react'
import { Button, Container, Nav, Navbar } from 'react-bootstrap'

import LoginModal from './LoginModal'
import type Player from 'src/Models/Player'

type LoginInfoProps = {
  username: string | null | undefined
  onLogin: (currentUser: Player) => void
  onLogout: () => void
}

const LoginInfo = (props: LoginInfoProps) => {
  const [show, setShow] = useState(false)

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)
  const handleLogin = (loggedInUser: Player) => {
    props.onLogin(loggedInUser)
    handleClose()
  }

  return props.username
    ? <>
      <Navbar.Text>
        Logged in as {props.username}
      </Navbar.Text>
      <Button type='submit' variant='danger' onClick={props.onLogout}>Log out</Button>
    </>
    : <>
      <Button id='open-login-modal-button' variant='success' onClick={handleShow}>Log in</Button>

      <LoginModal show={show} onClose={handleClose} onLogin={handleLogin} />
    </>
}

const ScoreboardNavBar = (props: LoginInfoProps) =>
  <Navbar collapseOnSelect expand='md' bg='dark' variant='dark'>
    <Container>
      <Navbar.Brand href='/global-scoreboard'>Ava&apos;s speedrunning global scoreboard</Navbar.Brand>
      <Navbar.Toggle aria-controls='basic-navbar-nav' />
      <Navbar.Collapse id='basic-navbar-nav'>
        <Nav className='me-auto'>
          <Nav.Link
            href='https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/main/README.md'
            target='about'
          >About</Nav.Link>
          <Nav.Link
            href='/global-scoreboard/game-search'
          >Game Search</Nav.Link>
          <Nav.Link
            href='https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/issues'
            target='about'
          >Report a bug, issue or suggestion</Nav.Link>
        </Nav>
        {props.username !== undefined &&
          <LoginInfo {...props} />
        }
      </Navbar.Collapse>
    </Container>
  </Navbar>

export default ScoreboardNavBar
