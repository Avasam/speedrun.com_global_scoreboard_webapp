import './App.css'

import { AppBar, Box, Button, CssBaseline, IconButton, Link, Toolbar, Typography } from '@material-ui/core'
import { lightBlue, red, teal } from '@material-ui/core/colors'
import { createTheme, ThemeProvider } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { StatusCodes } from 'http-status-codes'
import type { FC } from 'react'
import { StrictMode, useEffect, useState } from 'react'
import Div100vh from 'react-div-100vh'

import { apiGet } from './fetchers/Api'
import LoginForm from './LoginForm/LoginForm'
import type User from './models/User'
import ScheduleManagement from './ScheduleManagement/ScheduleManagement'
import ScheduleRegistration from './ScheduleRegistration/ScheduleRegistration'
import ScheduleViewer from './ScheduleViewer/ScheduleViewer'
import math from './utils/Math'

const themeSpacing = createTheme().spacing

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: teal,
    secondary: lightBlue,
    error: { main: red[700] },
    background: {
      // HACK: I shouldn't need to set this: https://next.material-ui.com/customization/default-theme/#explore
      default: '#222',
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: 'standard',
      },
    },
    // HACK: Couldn't get the color override working.
    // See the following issu for eventual solution:
    // https://github.com/mui-org/material-ui/issues/24778
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&.error': {
            color: red[700],
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          paddingLeft: themeSpacing(2),
          paddingRight: themeSpacing(2),
        },
        multiline: {
          '.MuiPaper-root:first-child > &': {
            paddingTop: themeSpacing(1),
            paddingBottom: themeSpacing(1),
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          paddingTop: 0,
          paddingBottom: 0,
          width: 'auto',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        'body': {
          fill: 'white',
        },
        '.MuiButtonBase-root.MuiPickersDay-root': {
          backgroundColor: 'unset',
        },
        '.PrivatePickersToolbar-root, .MuiTabs-root': {
          backgroundColor: '#222',
        },
        /* Replicate Material Design Style with AddToCalendar */
        '.chq-atc': {
          '.chq-atc--button.chq-atc--button, path, .chq-atc--dropdown, .chq-atc--dropdown a': {
            fontSize: '1rem',
            textTransform: 'none',
            borderRadius: themeSpacing(math.HALF),
            border: 'none',
            padding: 0,
            backgroundColor: 'transparent',
            color: 'inherit',
            fill: 'inherit !important',
          },
          '.chq-atc--dropdown a': {
            padding: `${themeSpacing(1)} ${themeSpacing(2)}`,
          },
          '.chq-atc--dropdown': {
            marginTop: `${themeSpacing(math.HALF)}`,
            marginLeft: `-${themeSpacing(1 + math.QUARTER)}`,
            width: `calc(100% + ${themeSpacing(2 + math.HALF)})`,
            padding: `${themeSpacing(1)} 0`,
            backgroundColor: '#121212',
            boxShadow: `0px 11px 15px -7px rgb(0 0 0 / 20%),
                        0px 24px 38px 3px rgb(0 0 0 / 14%),
                        0px 9px 46px 8px rgb(0 0 0 / 12%)`,
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.16))',
          },
        },
      },
    },
  },
})

const getCurrentUser = () => apiGet('users/current').then(res => res.json())

const logout = (setCurrentUser: (user: null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App: FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null | undefined>()
  const viewScheduleIdFromUrl = new URLSearchParams(window.location.search).get('view')
  const [viewScheduleId] = useState((viewScheduleIdFromUrl && Number.parseInt(viewScheduleIdFromUrl)) || null)

  // Take registrationLink from the URL if present,
  // otherwise from the localStorage if there are no other searchParam
  const [scheduleRegistrationLink] = useState<string | null>(
    new URLSearchParams(window.location.search).get('register') ??
    (window.location.search
      ? null
      : localStorage.getItem('register'))
  )

  // Keep the registrationLink in localStorage to simulate staying on the same page when reloading the registration page
  // despite clearing up the URL
  if (scheduleRegistrationLink) {
    localStorage.setItem('register', scheduleRegistrationLink)
    window.history.pushState(null, document.title, window.location.href.replace(window.location.search, ''))
  } else {
    localStorage.removeItem('register')
  }

  useEffect(() => {
    getCurrentUser()
      .then((res: { user: User | undefined }) => res.user)
      .then(setCurrentUser)
      .catch((err: Response) => {
        if (err.status === StatusCodes.UNAUTHORIZED) {
          setCurrentUser(null)
        } else {
          console.error(err)
        }
      })
  }, [])

  const isMobileSize = useMediaQuery('(max-width:640px)')

  return <StrictMode>
    <Div100vh className='App'>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <AppBar position='static' enableColorOnDark>
          <Toolbar>
            {(currentUser || scheduleRegistrationLink || viewScheduleId || isMobileSize) &&
              <Link
                component={IconButton}
                className='logo-button'
                onClick={() => localStorage.removeItem('register')}
                href={window.location.pathname}
              >
                <img
                  className='logo'
                  style={{ height: !currentUser && isMobileSize ? 'auto' : undefined }}
                  alt='logo'
                  src={`${window.process.env.REACT_APP_BASE_URL}/assets/images/favicon.webp`}
                />
              </Link>
            }
            <Typography variant={currentUser || isMobileSize ? 'h4' : 'h2'}>Tournament Scheduler</Typography>
            {currentUser &&
              <Button variant='contained' color='info' onClick={() => logout(setCurrentUser)}>Logout</Button>
            }
          </Toolbar>
        </AppBar>

        <Box sx={{
          backgroundColor: 'background.default',
          flex: 1,
          overflow: 'auto',
        }}>
          {scheduleRegistrationLink
            ? <ScheduleRegistration registrationLink={scheduleRegistrationLink} />
            : viewScheduleId
              ? <ScheduleViewer scheduleId={viewScheduleId} />
              : currentUser !== undefined && (currentUser
                ? <ScheduleManagement currentUser={currentUser} />
                : <LoginForm onLogin={setCurrentUser} />)
          }
        </Box>

        <Box sx={{ backgroundColor: 'background.default' }} component='footer'>
          &copy; <a
            href='https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/main/LICENSE'
            target='about'
          >Copyright</a> {new Date().getFullYear()} by <a
            href='https://github.com/Avasam/'
            target='about'
          >Samuel Therrien</a> (
          <a href='https://www.twitch.tv/Avasam' target='about'>
            Avasam<img
              height='14'
              alt='Twitch'
              src='https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png'
            ></img>
          </a>).
          Powered by <a
            href='https://www.speedrun.com/'
            target='src'
          >speedrun.com</a> and <a
            href='https://www.pythonanywhere.com/'
            target='about'
          >PythonAnywhere</a>
        </Box>
      </ThemeProvider>
    </Div100vh>
  </StrictMode>
}

export default App
