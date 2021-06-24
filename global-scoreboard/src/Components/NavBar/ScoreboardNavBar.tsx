import './ScoreboardNavBar.css'

import { faPalette, faStar } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useContext, useState } from 'react'
import { Button, Container, Dropdown, Nav, Navbar } from 'react-bootstrap'

import LoginModal from './LoginModal'
import type { Themes } from 'src/Components/ThemeProvider'
import { DARK_THEMES, LIGHT_THEMES, ThemeContext } from 'src/Components/ThemeProvider'
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
    ? <div className='login-info'>
      <Navbar.Text>
        Logged in as {props.username}
      </Navbar.Text>
      <Button type='submit' variant='danger' onClick={props.onLogout}>Log out</Button>
    </div>
    : <>
      <Button id='open-login-modal-button' variant='success' onClick={handleShow}>Log in</Button>

      <LoginModal show={show} onClose={handleClose} onLogin={handleLogin} />
    </>
}

const ScoreboardNavBar = (props: LoginInfoProps) => {
  const [, setTheme] = useContext(ThemeContext)
  const saveTheme = (theme: Themes) => {
    setTheme(theme)
    localStorage.setItem('preferedBootstrapTheme', theme)
  }

  const ThemeDropDownItem = (theme: Themes) =>
    <Dropdown.Item
      key={`theme-${theme}`}
      onClick={() => saveTheme(theme)}
    >
      {theme} {localStorage.getItem('preferedBootstrapTheme') === theme && <FontAwesomeIcon icon={faStar} />}
    </Dropdown.Item>

  return <Navbar collapseOnSelect expand='md' bg='dark' variant='dark'>
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
      <Dropdown align='end'>
        <Dropdown.Toggle >
          <FontAwesomeIcon icon={faPalette} />
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Header>Light Themes</Dropdown.Header>
          {LIGHT_THEMES.map(theme => ThemeDropDownItem(theme))}
          <Dropdown.Divider />
          <Dropdown.Header>Dark Themes</Dropdown.Header>
          {DARK_THEMES.map(theme => ThemeDropDownItem(theme))}
          <Dropdown.Divider />
          <Dropdown.Header>
            Powered by <a href='https://bootswatch.com/' target='about'>Bootswatch</a>
          </Dropdown.Header>
        </Dropdown.Menu>
      </Dropdown>
    </Container>
  </Navbar>
}

export default ScoreboardNavBar
