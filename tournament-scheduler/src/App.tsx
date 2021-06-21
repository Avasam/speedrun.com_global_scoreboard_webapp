import { AppBar, Box, Button, CssBaseline, IconButton, Link, Stack, Toolbar, Typography, useMediaQuery } from '@material-ui/core'
import { ThemeProvider } from '@material-ui/core/styles'
import Brightness4 from '@material-ui/icons/Brightness4'
import Brightness7 from '@material-ui/icons/Brightness7'
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
import darkTheme from './styles/dark.theme'
import lightTheme from './styles/light.theme'

type Themes = 'dark' | 'light'
type Body = { body: { background: string } }
const embedded = typeof new URLSearchParams(window.location.search).get('embedded') == 'string'
if (embedded) {
  (lightTheme.components?.MuiCssBaseline?.styleOverrides as unknown as Body).body.background = 'transparent';
  (darkTheme.components?.MuiCssBaseline?.styleOverrides as unknown as Body).body.background = 'transparent'
}

const getCurrentUser = () => apiGet('users/current').then(res => res.json())

const logout = (setCurrentUser: (user: null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App: FC = () => {
  const isMobileSize = useMediaQuery('(max-width:640px)', { noSsr: true })
  const prefersLightScheme = useMediaQuery('@media (prefers-color-scheme: light)', { noSsr: true })
  const savedTheme = prefersLightScheme ? 'light' : 'dark'
  const [preferedTheme, setPreferedTheme] = useState(savedTheme)
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

  const saveTheme = (theme: Themes) => {
    setPreferedTheme(theme)
    localStorage.setItem('preferedTheme', theme)
  }

  return <ThemeProvider theme={preferedTheme === 'light' ? lightTheme : darkTheme}>
    <CssBaseline />
    <Stack style={{ height: '100%', textAlign: 'center' }}>
      {!embedded &&
        <AppBar position='static' enableColorOnDark>
          <Toolbar>
            {(currentUser || isMobileSize || location.pathname !== '/') &&
              <Link
                component={RouterLink}
                to='/'
                style={{ height: 'auto', width: 'auto' }}
              >
                <IconButton>
                  <img
                    style={{
                      height: !currentUser && isMobileSize ? 'auto' : '40px',
                      maxWidth: '90px', // Enough to fit title at minimum supported width
                    }}
                    alt='logo'
                    src={`${window.process.env.REACT_APP_BASE_URL}/assets/images/favicon.webp`}
                  />
                </IconButton>
              </Link>
            }
            <div></div>
            <Typography variant={currentUser || isMobileSize ? 'h4' : 'h2'}>Tournament Scheduler</Typography>
            <div>
              {preferedTheme === 'dark'
                ? <IconButton onClick={() => saveTheme('light')}><Brightness7 /></IconButton>
                : <IconButton onClick={() => saveTheme('dark')}><Brightness4 /></IconButton>
              }
              {currentUser &&
                <Button
                  style={{ marginLeft: darkTheme.spacing(2) }}
                  variant='contained'
                  color='secondary'
                  onClick={() => logout(setCurrentUser)}>Logout</Button>
              }
            </div>
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
        &copy; <Link
          href='https://github.com/Avasam/speedrun.com_global_scoreboard_webapp/blob/main/LICENSE'
          target='about'
        >Copyright</Link> {new Date().getFullYear()} by <Link
          href='https://github.com/Avasam/'
          target='about'
        >Samuel Therrien</Link> (
        <Link href='https://www.twitch.tv/Avasam' target='about'>
          Avasam<img
            height='14'
            alt='Twitch'
            src='https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png'
          ></img>
        </Link>).
        Powered by <Link
          href='https://www.speedrun.com/'
          target='src'
        >speedrun.com</Link> and <Link
          href='https://www.pythonanywhere.com/'
          target='about'
        >PythonAnywhere</Link>
      </footer>
    </Stack>
  </ThemeProvider>
}

export default App
