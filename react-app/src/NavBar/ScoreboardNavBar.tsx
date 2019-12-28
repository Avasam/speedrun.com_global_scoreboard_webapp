import React, { useState } from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';
import './ScoreboardNavBar.css';
import LoginModal from './LoginModal'

type LoginInfoProps = {
  username: string | null
}

const LoginInfo = (props: LoginInfoProps) => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return props.username
    ? <>
      <Navbar.Text>
        Logged in as {props.username}
      </Navbar.Text>
      <Button type="submit" variant="danger">Log out</Button>
    </>
    : <>
      <Button variant="success" onClick={handleShow}>Log in</Button>

      <LoginModal show={show} handleClose={handleClose}></LoginModal>
    </>
}

const ScoreboardNavBar = (props: LoginInfoProps) =>
  <Navbar collapseOnSelect expand="md" bg="dark" variant="dark">
    <Navbar.Brand href="#/">Ava's speedrunning global scoreboard</Navbar.Brand>
    <Navbar.Toggle aria-controls="basic-navbar-nav" />
    <Navbar.Collapse id="basic-navbar-nav">
      <Nav className="mr-auto">
        <Nav.Link
          href="https://github.com/Avasam/speedrun.com_global_leaderboard_webapp/blob/master/README.md"
          target="about"
        >About</Nav.Link>
      </Nav>
      <LoginInfo username={props.username} />
    </Navbar.Collapse>
  </Navbar>

export default ScoreboardNavBar
