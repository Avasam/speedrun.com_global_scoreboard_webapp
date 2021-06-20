/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import './App.css'

import { AppBar, Box, Button, CssBaseline, IconButton, Link, Stack, Toolbar, Typography } from '@material-ui/core'
import { lightBlue, red, teal } from '@material-ui/core/colors'
import { createTheme, ThemeProvider } from '@material-ui/core/styles'
import useMediaQuery from '@material-ui/core/useMediaQuery'
import { StatusCodes } from 'http-status-codes'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { Link as RouterLink, Route, useLocation } from 'react-router-dom'

import LoginForm from './Components/LoginForm/LoginForm'
import ScheduleManagement from './Components/ScheduleManagement/ScheduleManagement'
import ScheduleRegistration from './Components/ScheduleRegistration'
import ScheduleViewer from './Components/ScheduleViewer'
import { apiGet } from './fetchers/Api'
import type User from './Models/User'
import math from './utils/Math'

const themeSpacing = createTheme().spacing

const embedded = typeof new URLSearchParams(window.location.search).get('embedded') == 'string'

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
          background: embedded ? 'transparent' : undefined,
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

// eslint-disable-next-line complexity
const App: FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null | undefined>()
  const location = useLocation()

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

  return <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <Stack style={{ height: '100%', textAlign: 'center' }}>
      {!embedded &&
        <AppBar position='static' enableColorOnDark>
          <Toolbar>
            {(currentUser || isMobileSize || location.pathname !== '/') &&
              <Link
                component={RouterLink}
                className='logo-button'
                to='/'
              >
                <IconButton>
                  <img
                    className='logo'
                    style={{ height: !currentUser && isMobileSize ? 'auto' : undefined }}
                    alt='logo'
                    src={`${window.process.env.REACT_APP_BASE_URL}/assets/images/favicon.webp`}
                  />
                </IconButton>
              </Link>
            }
            <Typography variant={currentUser || isMobileSize ? 'h4' : 'h2'}>Tournament Scheduler</Typography>
            {currentUser &&
              <Button variant='contained' color='info' onClick={() => logout(setCurrentUser)}>Logout</Button>
            }
          </Toolbar>
        </AppBar>
      }

      <Box sx={{
        flex: 1,
        overflow: 'auto',
      }}>
        {currentUser !== undefined &&
          <Route
            path='/'
            exact
            render={currentUser
              ? () => <ScheduleManagement currentUser={currentUser} />
              : () => <LoginForm onLogin={setCurrentUser} />
            } />
        }
        <Route
          path='/view/:scheduleId'
          render={routeProps => <ScheduleViewer scheduleId={Number(routeProps.match.params.scheduleId)} />}
        />
        <Route
          path='/register/:registrationId?'
          render={routeProps => <ScheduleRegistration {...routeProps.match.params} />}
        />
      </Box>

      <footer>
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
      </footer>
    </Stack>
  </ThemeProvider>
}

export default App
