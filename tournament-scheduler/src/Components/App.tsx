import { AppBar, Box, Button, CssBaseline, IconButton, Link, Stack, Toolbar, Typography, useMediaQuery } from '@material-ui/core'
import { ThemeProvider } from '@material-ui/core/styles'
import Brightness4 from '@material-ui/icons/Brightness4'
import Brightness7 from '@material-ui/icons/Brightness7'
import { StatusCodes } from 'http-status-codes'
import { useEffect, useState } from 'react'
import { Link as RouterLink, Route, Switch, useLocation } from 'react-router-dom'

import LoginForm from './LoginForm/LoginForm'
import ScheduleManagement from './ScheduleManagement/ScheduleManagement'
import ScheduleRegistration from './ScheduleRegistration'
import ScheduleGroupViewer from './ScheduleViewer/ScheduleGroupViewer'
import ScheduleViewer from './ScheduleViewer/ScheduleViewer'
import { apiGet } from 'src/fetchers/Api'
import type User from 'src/Models/User'
import darkTheme from 'src/styles/dark.theme'
import lightTheme from 'src/styles/light.theme'
import copyToClipboard from 'src/utils/Clipboard'

type Themes = 'dark' | 'light'
type StylesOverrides = { body: { background: string } }
const embedded = typeof new URLSearchParams(window.location.search).get('embedded') == 'string'
if (embedded) {
  (lightTheme.components?.MuiCssBaseline?.styleOverrides as unknown as StylesOverrides).body.background = 'transparent';
  (darkTheme.components?.MuiCssBaseline?.styleOverrides as unknown as StylesOverrides).body.background = 'transparent'
}

const getCurrentUser = () => apiGet('users/current').then(res => res.json())

const logout = (setCurrentUser: (user: null) => void) => {
  setCurrentUser(null)
  localStorage.removeItem('jwtToken')
}

const App = () => {
  /* eslint-disable react-hooks/rules-of-hooks */
  for (const param of ['register', 'view']) {
    const oldParamValue = new URLSearchParams(window.location.search).get(param)
    if (oldParamValue != null) {
      const newLink = `${window.location.origin}${process.env.PUBLIC_URL}/${param}/${oldParamValue}`
      console.warn(`Old ${param} param found in URL, redirecting to:`, newLink)
      copyToClipboard(newLink).finally(() => window.location.href = newLink)
      return <></>
    }
  }

  const isMobileSize = useMediaQuery('(max-width:640px)', { noSsr: true })
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

  const prefersLightScheme = useMediaQuery('@media (prefers-color-scheme: light)', { noSsr: true })
  const savedTheme = localStorage.getItem('preferedMaterialTheme') ?? (prefersLightScheme ? 'light' : 'dark')
  const [preferedMaterialTheme, setpreferedMaterialTheme] = useState(savedTheme)
  const saveTheme = (theme: Themes) => {
    setpreferedMaterialTheme(theme)
    localStorage.setItem('preferedMaterialTheme', theme)
  }

  return <ThemeProvider theme={preferedMaterialTheme === 'light' ? lightTheme : darkTheme}>
    <CssBaseline />
    <Stack style={{ height: '100%', textAlign: 'center' }}>
      {!embedded &&
        <AppBar position='static' enableColorOnDark>
          <Toolbar>
            <Link
              component={RouterLink}
              to='/'
              style={{ height: 'auto', width: 'auto' }}
            >
              {(currentUser || isMobileSize || location.pathname !== '/') &&
                <IconButton>
                  <img
                    style={{
                      height: !currentUser && isMobileSize ? 'auto' : '40px',
                      maxWidth: '90px', // Enough to fit title at minimum supported width
                    }}
                    alt='logo'
                    src={`${window.location.origin}/assets/images/favicon.webp`}
                  />
                </IconButton>
              }
            </Link>
            <Typography variant={currentUser || isMobileSize ? 'h4' : 'h2'}>Tournament Scheduler</Typography>
            <Stack direction='row' spacing={2} flexWrap='wrap' justifyContent='flex-end' alignItems='center'>
              {preferedMaterialTheme === 'dark'
                ? <IconButton color='default' onClick={() => saveTheme('light')}><Brightness7 /></IconButton>
                : <IconButton color='default' onClick={() => saveTheme('dark')}><Brightness4 /></IconButton>
              }
              {currentUser &&
                <Button
                  size='small'
                  variant='contained'
                  color='secondary'
                  onClick={() => logout(setCurrentUser)}
                >Logout</Button>
              }
            </Stack>
          </Toolbar>
        </AppBar>
      }

      <Box sx={{
        flex: 1,
        overflow: 'auto',
      }}>
        <Switch>
          <Route
            exact
            path='/view/:scheduleId'
            render={routeProps => <ScheduleViewer scheduleId={Number(routeProps.match.params.scheduleId)} />}
          />
          <Route
            path='/view/group/:groupId'
            render={routeProps => <ScheduleGroupViewer groupId={Number(routeProps.match.params.groupId)} />}
          />
          <Route
            path='/register/:registrationId?'
            render={routeProps => <ScheduleRegistration {...routeProps.match.params} />}
          />
          {currentUser !== undefined &&
            <Route
              render={currentUser
                ? () => <ScheduleManagement currentUser={currentUser} />
                : () => <LoginForm onLogin={setCurrentUser} />
              } />
          }
        </Switch>
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
